import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import OpenAI from 'openai';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private openai: OpenAI | null = null;
  private ollama: Ollama | null = null;

  constructor(
    private readonly configService: ConfigService,
  ) {
    // Initialize Ollama if OLLAMA_BASE_URL is present
    const ollamaBaseUrl = this.configService.get<string>('OLLAMA_BASE_URL');
    if (ollamaBaseUrl) {
      this.ollama = new Ollama({ host: ollamaBaseUrl });
    }

    // Initialize OpenAI only if no Ollama and OPENAI_API_KEY is present
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!this.ollama && openaiApiKey) {
      this.openai = new OpenAI({ apiKey: openaiApiKey });
    }
  }

  async generate(prompt: string): Promise<string> {
    // Try Ollama first if available
    if (this.ollama) {
      try {
        const response = await this.ollama.generate({
          model: 'mistral:latest',
          prompt: prompt,
          stream: false,
        });
        return response.response;
      } catch (error) {
        this.logger.error('Ollama generation failed', error);
        // Don't fallback to OpenAI if Ollama fails
        throw new Error('Ollama generation failed');
      }
    }

    // Fallback to OpenAI if available
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });
        if (!completion.choices[0].message.content) {
          throw new Error('OpenAI generation failed');
        }
        return completion.choices[0].message.content;
      } catch (error) {
        this.logger.error('OpenAI generation failed', error);
        throw new Error('OpenAI generation failed');
      }
    }

    // Throw error if neither provider is available
    throw new Error('No LLM provider available. Please configure either Ollama or OpenAI.');
  }
}
