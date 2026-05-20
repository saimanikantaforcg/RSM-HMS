import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export type RcmStage = 'Pre-Registration' | 'Coding & Billing' | 'Claim Submission' | 'Payment Posting';
export type RcmStatus = 'Cleared' | 'In Progress' | 'Denied' | 'Pending';

@Entity('rcm_entries')
@Index(['tenantId', 'patientId'])
export class RcmEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', name: 'patient_id', nullable: true })
  patientId: string;

  @Column({ name: 'patient_name' })
  patientName: string;

  @Column({ type: 'varchar', default: 'Coding & Billing' })
  stage: RcmStage;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: number;

  @Column({ type: 'varchar', default: 'In Progress' })
  status: RcmStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
