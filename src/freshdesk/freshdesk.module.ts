import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreshdeskController } from './freshdesk.controller';
import { FreshdeskService } from './freshdesk.service';
import { FreshdeskConfig } from './entities/freshdesk.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { FreshdeskProcessor } from './freshdesk.processor';
import { HttpModule } from '@nestjs/axios';
import { LlmModule } from 'src/llm/llm.module';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAME } from './freshdesk.constants';
import { Queue } from 'bullmq';
import { Agent } from './entities/agent.entity';
import { Contact } from './entities/contact.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([FreshdeskConfig, Contact, Agent]),
    HttpModule,
    LlmModule,
    BullModule.registerQueue({
      name: QUEUE_NAME,
    }),
  ],
  controllers: [FreshdeskController],
  providers: [FreshdeskService, FreshdeskProcessor],
  exports: [FreshdeskService],
})
export class FreshdeskModule {}
