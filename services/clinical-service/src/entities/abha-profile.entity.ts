import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export type AbhaKycStatus = 'Pending' | 'Verified' | 'Failed';

@Entity('abha_profiles')
@Index(['tenantId', 'patientId'])
export class AbhaProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ type: 'varchar', name: 'abha_number', unique: true, nullable: true })
  abhaNumber: string;

  @Column({ type: 'varchar', name: 'abha_address', unique: true, nullable: true })
  abhaAddress: string;

  @Column({ type: 'varchar', default: 'Pending' })
  kycStatus: AbhaKycStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
