import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LlmService } from './llm.service';
import { Ollama } from 'ollama';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [HttpModule],
  providers: [LlmService, Ollama],
  exports: [LlmService],
})
export class LlmModule implements OnModuleInit {
    private readonly logger = new Logger(LlmModule.name);
    
    constructor(private readonly configService: ConfigService) {}
    
    async onModuleInit() {
        const ollama = new Ollama({
            host: this.configService.get('OLLAMA_BASE_URL'),
        });
        try {
            const {models} = await ollama.list();
            if (models.length === 0) {
                this.logger.warn('Ollama is not running');
                throw new Error('Ollama does not have models');
            }
        } catch (error) {
            this.logger.warn('Ollama is not running');
            throw new Error('Ollama is not running');
        }
        if (!this.configService.get('OPENAI_API_KEY')) {
            this.logger.error('OpenAI key is not set');
            throw new Error('OpenAI key is not set');
        }
        this.logger.log('LlmModule initialized');
    }
}
