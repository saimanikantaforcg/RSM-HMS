import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export type SurgeryBlockStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

@Entity('surgery_blocks')
@Index(['tenantId', 'patientName'])
export class SurgeryBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'patient_name' })
  patientName: string;

  @Column({ name: 'procedure_name' })
  procedureName: string;

  @Column({ name: 'schedule_time' })
  time: string;

  @Column()
  room: string;

  @Column()
  surgeon: string;

  @Column({ type: 'varchar', default: 'Scheduled' })
  status: SurgeryBlockStatus;

  @Column({ name: 'clearance', default: 'PRE-OP Cleared' })
  clearance: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
