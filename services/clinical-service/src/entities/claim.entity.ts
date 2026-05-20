import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export type ClaimStatus = 'Submitted' | 'Approved' | 'Denied' | 'Pending Info';

@Entity('claims')
@Index(['tenantId', 'patientId'])
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ type: 'varchar', name: 'patient_name', nullable: true })
  patientName: string;

  @Column({ type: 'varchar', name: 'invoice_id', nullable: true })
  invoiceId: string;

  @Column()
  payer: string; // Name of Insurance / TPA

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  claimAmount: number;

  @Column({ type: 'varchar', default: 'Submitted' })
  status: ClaimStatus;

  @Column({ type: 'varchar', nullable: true })
  denialReason: string;

  @CreateDateColumn()
  submittedDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
