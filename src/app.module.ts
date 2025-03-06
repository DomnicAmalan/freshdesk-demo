import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmConfigModule } from './typeorm/typeorm.module';
import { FreshdeskModule } from './freshdesk/freshdesk.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreshdeskConfig } from './freshdesk/entities/freshdesk.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.docker'],

    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
    }),
    TypeOrmConfigModule,
    FreshdeskModule,
    TypeOrmModule.forFeature([FreshdeskConfig]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
