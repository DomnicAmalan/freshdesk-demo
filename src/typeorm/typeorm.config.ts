import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { FreshdeskConfig } from '../freshdesk/entities/freshdesk.entity';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USER', 'your_db_user'),
    password: configService.get<string>('DB_PASSWORD', 'your_db_password'),
    database: configService.get<string>('DB_NAME', 'your_db_name'),
    entities: [
      path.join(__dirname, '../**/*.entity{.ts,.js}'),
      FreshdeskConfig,
    ],
    synchronize: configService.get<boolean>('DB_SYNC', false),
    logging: configService.get<boolean>('DB_LOGGING', false),
  };
};
