import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import axios from 'axios';
import { FreshdeskConfig } from './entities/freshdesk.entity';
import { CreateConfigDto } from './dto/create-config.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Freshdesk from '@freshworks/freshdesk';
import { LlmService } from '../llm/llm.service';
import {
    generateAgentsPrompt,
    generateContactsPrompt,
    generateRandomTicketDataPrompt,
    generateTicketReplyPrompt,
} from './freshdesk.prompts';
import { FRESHDESK_EVENTS, FRESHDESK_JOB_OPTIONS, FRESHWORKS, QUEUE_NAME } from './freshdesk.constants';
import { UpdateConfigDto } from './dto/update-config.dto';
import { createFreshdeskClient } from './freshdesk.http';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';
import { HttpService } from '@nestjs/axios';
import { Contact } from './entities/contact.entity';
import { Agent } from './entities/agent.entity';

@Injectable()
export class FreshdeskService {
    private readonly logger = new Logger(FreshdeskService.name);
    constructor(
        @InjectRepository(FreshdeskConfig)
        private readonly freshdeskRepo: Repository<FreshdeskConfig>,
        @InjectRepository(Contact)
        private readonly contactRepo: Repository<Contact>,
        @InjectRepository(Agent)
        private readonly agentRepo: Repository<Agent>,
        private readonly httpService: HttpService,
        private readonly llmService: LlmService,
        @InjectQueue(QUEUE_NAME) private readonly queue: Queue,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async resetTicketQuota() {
        await this.freshdeskRepo.update({}, { ticketQuotaCompleted: 0 });
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleCron() {
        this.logger.log(
            'Running scheduled task to check for new companies and manage tickets',
        );

        const configs = await this.getAllConfigs();
        this.logger.log(`Found ${configs.length} configs`);
        for (const config of configs) {
            await this.createJobIfAllowed(config);
        }
    }

    private async createJobIfAllowed(config: FreshdeskConfig) {
        const { id: companyId } = config;
        const now = new Date();
        if (!config) {
            throw new Error('Freshdesk config not found');
        }
        this.logger.log(`Creating job for company ID: ${companyId}`);
        await this.queue.add(
            QUEUE_NAME,
            {
                companyId,
                type: FRESHDESK_EVENTS.CREATE_TICKET,
                ticketReplyInterval: config.ticketReplyInterval,
                queueName: QUEUE_NAME,
            },
            {
                ...FRESHDESK_JOB_OPTIONS,
            }
        );
        
        await this.freshdeskRepo.update(companyId, { ticketCreatedTime: now })
    }

    async freshdeskClient(companyId: string): Promise<Freshdesk> {
        const config = await this.freshdeskRepo.findOne({
            where: { id: companyId },
        });
        if (!config) {
            throw new Error('Freshdesk config not found');
        }
        return new Freshdesk({
            domain: config.freshdeskUrl,
            apiKey: config.apiKey,
        });
    }

    async getAllConfigs(): Promise<FreshdeskConfig[]> {
        const today = new Date().toISOString().split('T')[0];

        const query = `
            SELECT config.*
            FROM freshdesk_config AS config
            LEFT JOIN (
                SELECT 
                    COUNT(ticket.id) AS "ticketsCreatedToday",
                    ticket."companyName"
                FROM freshdesk_config AS ticket
                WHERE DATE(ticket."ticketCreatedTime") = $1
                GROUP BY ticket."companyName"
            ) AS ticketCount
            ON ticketCount."companyName" = config."companyName" 
            WHERE config."isActive" = true AND (
                (ticketCount."ticketsCreatedToday" < config."ticketsPerDay"
                AND EXTRACT(EPOCH FROM (NOW() - config."ticketCreatedTime")) > config."ticketCreateInterval")
                OR ticketCount."ticketsCreatedToday" IS NULL
            );
        `;

        return await this.freshdeskRepo.query(query, [today]);
    }

    async getConfig(freshdeskUrl: string): Promise<FreshdeskConfig | null> {
        return this.freshdeskRepo.findOne({ where: { freshdeskUrl } });
    }

    async createConfig(
        createConfigDto: CreateConfigDto,
    ): Promise<any> {
        createConfigDto.freshdeskUrl = createConfigDto.freshdeskUrl.trim().replace(/\/+$/, '');
        const {
            freshdeskUrl,
            apiKey,
            ticketCreateInterval,
            ticketReplyInterval,
            ticketsPerDay,
        } = createConfigDto;
        await this.verifyCredentials(freshdeskUrl, apiKey);

        const existingConfig = await this.getConfig(freshdeskUrl);
        if (existingConfig) {
            await this.createContactsAndAgents(existingConfig);
            return existingConfig;
        }
        const savedConfig = await this.saveConfig(
            freshdeskUrl,
            apiKey,
            ticketCreateInterval,
            ticketReplyInterval,
            ticketsPerDay,
        );
        // Create contacts and agents
        await this.createContactsAndAgents(savedConfig);
        return savedConfig;
    }

    private async getExistingContactsAndAgents(config: FreshdeskConfig): Promise<{ existingContactsDb?: any, existingAgentsDb?: any, contacts?: any, agents: any }> {
        const httpClient = createFreshdeskClient(
            config.freshdeskUrl,
            config.apiKey,
        );
        const id = config.id
        try {
            const existingContactsDb = await this.contactRepo.find({ where: { config: { id } } });
            const existingAgentsDb = await this.agentRepo.find({ where: { config: { id } } });

            let { data: contacts } = await httpClient.get(FRESHWORKS.FRESHDESK.CONTACTS.url);
            let { data: agents } = await httpClient.get(FRESHWORKS.FRESHDESK.AGENTS.url);
            return { existingContactsDb, existingAgentsDb, contacts, agents };
        } catch (error) {
            this.logger.error(`Failed to get existing contacts and agents: ${error.message}`);
            throw new Error(`Failed to get existing contacts and agents: ${error.message}`);
        }
    }

    private async createContacts(config: FreshdeskConfig, httpClient: any): Promise<any> {
        const generateContactsLlm = await this.llmService.generate(generateContactsPrompt());
        const contacts = JSON.parse(generateContactsLlm);
        for (const contact of contacts) {
            const response = await httpClient.post(
                FRESHWORKS.FRESHDESK.CONTACTS.url,
                contact,
            );
            const contactResponse = await response.data;
            if (contactResponse.status === 201) {
                await this.contactRepo.save({
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                    freshdeskUserId: contact.id,
                    config,
                });
            }
        }
    }

    private async createAgents(config: FreshdeskConfig, httpClient: any): Promise<any[] | undefined> {
        try {
            
            const generateAgentsLlm = await this.llmService.generate(generateAgentsPrompt());
            const agents = JSON.parse(generateAgentsLlm);
            for (const agent of agents) {
                const response = await httpClient.post(
                    FRESHWORKS.FRESHDESK.AGENTS.url,
                    agent,
                );
                const agentResponse = await response.data;
                if (agentResponse.status === 201) {
                    await this.agentRepo.save({
                        config,
                        freshdeskUserId: agent.id,
                    });
                }
            }
            
        } catch (error) {
            this.logger.error(`Failed to create agents: ${error.message}`);
            return;
        }
    }
    private async createContactsAndAgents(config: FreshdeskConfig): Promise<void> {
        try {
            if (!config) {
                throw new Error('Config is required');
            }
            const httpClient = createFreshdeskClient(
                config.freshdeskUrl,
                config.apiKey,
            );
            const { existingContactsDb, existingAgentsDb, contacts, agents } = await this.getExistingContactsAndAgents(config);
            if (existingContactsDb.length <= 0 && contacts.length <= 0) {
                await this.createContacts(config, httpClient);
            } else if (existingContactsDb.length <= 0 && contacts.length > 0) {
                contacts.forEach(async (contact: any) => {
                    await this.contactRepo.save({
                        name: contact.name,
                        email: contact.email,
                        phone: contact.phone,
                        freshdeskUserId: contact.id,
                        config,
                    });
                });
            }
            if (existingAgentsDb.length <= 0 && agents.length <= 0) {
                await this.createAgents(config, httpClient);
            } else if (existingAgentsDb.length <= 0 && agents.length > 0) {
                agents.forEach(async (agent: any) => {
                    await this.agentRepo.save({
                        config,
                        freshdeskUserId: agent.id,
                        available: agent.available,
                    });
                });
            }
            await this.freshdeskRepo.update(config.id, { isActive: true });
            return;
        } catch (error) {
            throw new Error(`Failed to create contacts and agents: ${error.message}`);
        }
    }

    async verifyCredentials(
        freshdeskUrl: string,
        apiKey: string,
    ): Promise<boolean> {
        try {
            const response = await axios.get(`${freshdeskUrl}/api/v2/tickets`, {
                auth: { username: apiKey, password: 'X' },
            });
            return response.status === 200;
        } catch (error) {
            throw new BadRequestException('Invalid Freshdesk API Key or URL');
        }
    }

    async saveConfig(
        freshdeskUrl: string,
        apiKey: string,
        ticketCreateInterval: number,
        ticketReplyInterval: number,
        ticketsPerDay: number,
    ): Promise<FreshdeskConfig> {

        const domain = new URL(freshdeskUrl).hostname;
        if (!domain.includes('freshdesk.com')) {
            throw new BadRequestException('Invalid Freshdesk domain');
        }

        const companyName = domain.split('.')[0];
        if (!companyName) {
            throw new BadRequestException('Could not parse company name from domain');
        }

        const existingConfig = await this.freshdeskRepo.findOne({
            where: { freshdeskUrl: domain },
        });
        if (existingConfig) {
            throw new BadRequestException('Domain already registered');
        }

        const config = this.freshdeskRepo.create({
            companyName,
            apiKey,
            freshdeskUrl: freshdeskUrl.trim().replace(/\/+$/, ''),
            ticketCreateInterval,
            ticketReplyInterval,
            ticketsPerDay,
        });

        const savedConfig = await this.freshdeskRepo.save(config);

        return savedConfig;
    }

    async createTicket(companyId: string): Promise<string> {
        const config = await this.freshdeskRepo.findOne({
            where: { id: companyId },
        });
        if (!config) {
            throw new Error(`Configuration not found for company ID: ${companyId}`);
        }
        let ticketFields = await this.getTicketFields(companyId);
        const parsedTicketFields = {};
        ticketFields = ticketFields.map((field: any) => {
            if (field?.choices) {
                parsedTicketFields[field.name] = field.choices
                    ? `${JSON.stringify(field?.choices)} `
                    : 'Random Priority';
                return parsedTicketFields;
            }
        });
        let ticketData = await this.llmService.generate(
            generateRandomTicketDataPrompt(parsedTicketFields),
        );
        ticketData = ticketData.replace(/```json/g, '').replace(/```/g, '');
        ticketData = JSON.parse(ticketData);
        try {
            const httpClient = createFreshdeskClient(
                config.freshdeskUrl,
                config.apiKey,
            );

            const response = await httpClient.post(
                FRESHWORKS.FRESHDESK.CREATE_TICKET.url,
                ticketData,
            );

            const responseData = await response.data;
            await this.freshdeskRepo.update(companyId, {
                ticketQuotaCompleted: config.ticketQuotaCompleted + 1,
            });
            this.logger.log(`Ticket created for reply: ${responseData.id}`);
            await this.queue.add(
                QUEUE_NAME,
                {
                    ...responseData,
                    companyId,
                    type: FRESHDESK_EVENTS.REPLY_TICKET,
                    ticketId: responseData.id,
                    ticketReplyInterval: config.ticketReplyInterval,
                    queueName: QUEUE_NAME,
                },
                {
                    delay: config.ticketReplyInterval * 1000,
                    ...FRESHDESK_JOB_OPTIONS,
                }
            );

            return responseData.id;
        } catch (error) {
            throw new Error('Failed to create ticket: ' + error.message);
        }
    }

    async getTicketFields(companyId: string): Promise<Array<any>> {
        const config = await this.freshdeskRepo.findOne({
            where: { id: companyId },
        });
        if (!config) {
            throw new Error(`Configuration not found for company ID: ${companyId}`);
        }

        const httpClient = createFreshdeskClient(
            config.freshdeskUrl,
            config.apiKey,
        );

        const response = await httpClient.get(
            FRESHWORKS.FRESHDESK.TICKET_FIELDS.url,
        );
        return response.data;
    }

    async replyToTicket(companyId: string, jobData: any): Promise<void> {
        const config = await this.freshdeskRepo.findOne({
            where: { id: companyId },
        });

        if (!config) {
            throw new Error(`Configuration not found for company ID: ${companyId}`);
        }
        const { ticketId } = jobData;
        if (!ticketId) {
            throw new Error(`Ticket ID not found for company ID: ${companyId}`);
        }
        const httpClient = createFreshdeskClient(
            config.freshdeskUrl,
            config.apiKey,
        );

        try {

            const ticket = await httpClient.get(
                FRESHWORKS.FRESHDESK.GET_TICKET(ticketId).url,
            );
            const ticketData = await ticket.data;

            const companyInfo = { companyName: config.companyName };
            let replyResponseJson = await this.llmService.generate(
                generateTicketReplyPrompt(ticketData, companyInfo),
            );
            let replyResponse;
            try {
                replyResponseJson = replyResponseJson
                    .replace(/```json/g, '')
                    .replace(/```/g, '');
                replyResponse = JSON.parse(replyResponseJson);
            } catch (error) {
                throw new Error('Error parsing LLM response: ' + error.message);
            }
            const agents = await httpClient.get(
                FRESHWORKS.FRESHDESK.AGENTS.url,
            );
            replyResponse.from_email = agents.data[0].email;
            replyResponse.user_id = agents.data[0].id;
            await httpClient.post(
                FRESHWORKS.FRESHDESK.TICKET_REPLY(ticketId).url,
                replyResponse,
            );
        } catch (error) {
            throw new Error('Failed to reply to ticket: ' + error.message);
        }
    }

    async removeConfig(companyName: string): Promise<DeleteResult> {
        return await this.freshdeskRepo.delete({ companyName });
    }

    async getConfigById(id: string): Promise<FreshdeskConfig | null> {
        return this.freshdeskRepo.findOne({ where: { id } });
    }

    async updateConfig(
        companyId: string,
        updateConfigDto: UpdateConfigDto,
    ): Promise<FreshdeskConfig> {
        const config = await this.getConfigById(companyId);
        if (!config) {
            throw new BadRequestException(`Company with ID ${companyId} not found`);
        }

        const { apiKey } = updateConfigDto;

        if (apiKey && apiKey !== config.apiKey) {
            await this.verifyCredentials(config.freshdeskUrl, apiKey);
        }

        await this.freshdeskRepo.update(companyId, updateConfigDto);

        const updatedConfig = await this.getConfigById(companyId);
        if (!updatedConfig) {
            throw new BadRequestException(
                `Failed to retrieve updated config for ID ${companyId}`,
            );
        }

        return updatedConfig;
    }

    async removeCompanyById(companyId: string): Promise<void> {
        const config = await this.getConfigById(companyId);
        if (!config) {
            throw new BadRequestException(`Company with ID ${companyId} not found`);
        }

        try {
            const jobs = await this.queue.getJobs();

            for (const job of jobs) {
                if (job.data.companyId === companyId) {
                    await job.remove();
                }
            }
        } catch (error) {
            this.logger.error(
                `Error clearing queue for company ${companyId}:`,
                error,
            );
        }

        await this.freshdeskRepo.delete(companyId);
    }
}
