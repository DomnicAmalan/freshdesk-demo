import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { FreshdeskConfig } from './freshdesk.entity';

@Entity()
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({type: 'bigint'})
  freshdeskUserId: bigint;

  @ManyToOne(() => FreshdeskConfig, (config) => config.contacts)
  config: FreshdeskConfig;
} 