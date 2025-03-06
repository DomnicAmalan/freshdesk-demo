import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { FreshdeskConfig } from './freshdesk.entity';

@Entity()
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({type: 'bigint'})
  freshdeskUserId: bigint;

  @Column()
  available: boolean;

  @ManyToOne(() => FreshdeskConfig, (config) => config.agents)
  config: FreshdeskConfig;
} 