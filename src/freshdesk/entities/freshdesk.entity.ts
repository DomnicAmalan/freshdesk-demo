import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany } from 'typeorm';
import { Contact } from './contact.entity';
import { Agent } from './agent.entity';

@Entity()
@Unique(['companyName'])
@Unique(['freshdeskUrl'])
export class FreshdeskConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  companyName: string;

  @Column()
  apiKey: string;

  @Column()
  freshdeskUrl: string;

  @Column({ type: 'int', default: 60 })
  ticketCreateInterval: number;

  @Column({ type: 'int', default: 60 })
  ticketReplyInterval: number;

  @Column({ type: 'int', default: 10 })
  ticketsPerDay: number;

  @Column({ type: 'int', default: 0 })
  ticketQuotaCompleted: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  
  @Column({ type: 'timestamp', nullable: true })
  ticketCreatedTime: Date;

  @OneToMany(() => Contact, (contact) => contact.config)
  contacts: Contact[];

  @OneToMany(() => Agent, (agent) => agent.config)
  agents: Agent[];

  @Column({ type: 'boolean', default: false })
  isActive: boolean;
}
