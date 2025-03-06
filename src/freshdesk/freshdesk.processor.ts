import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { FreshdeskService } from './freshdesk.service';
import { Logger } from '@nestjs/common';
import { FRESHDESK_EVENTS, QUEUE_NAME } from './freshdesk.constants';

@Processor(QUEUE_NAME)
export class FreshdeskProcessor {
  private readonly logger = new Logger(FreshdeskProcessor.name);

  constructor(private readonly freshdeskService: FreshdeskService,) {}
  onModuleInit() {
    this.logger.log('FreshdeskProcessor initialized');
  }
  @Process(QUEUE_NAME)
  async handleFreshdesk(job: Job) {
    switch (job.data.type) {
      case FRESHDESK_EVENTS.CREATE_TICKET:
        await this.handleCreateTicket(job);
        break;
      case FRESHDESK_EVENTS.REPLY_TICKET:
        await this.handleReplyTicket(job);
        break;
    }
  }

  async handleCreateTicket(job: Job) {
    try {
      this.logger.log(`Processing create ticket job: ${job.id}`);
      const { companyId } = job.data;
      await this.freshdeskService.createTicket(companyId);
      this.logger.log(`Successfully processed create ticket job: ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed to process create ticket job: ${job.id}`, error.stack);
      throw error;
    }
  }

  async handleReplyTicket(job: Job) {
    try {
      this.logger.log(`Processing reply ticket job: ${job.id}`);
      const { companyId } = job.data;
      await this.freshdeskService.replyToTicket(companyId, job.data);
      this.logger.log(`Successfully processed reply ticket job: ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed to process reply ticket job: ${job.id}`, error.stack);
      throw error;
    }
  }
}
