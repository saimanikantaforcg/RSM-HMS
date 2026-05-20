import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn
} from 'typeorm';
import { Bed } from './bed.entity';
import { DataEncryptionTransformer } from '../common/transformers/encryption.transformer';

export type AdmissionStatus = 'Active' | 'Discharged' | 'Transferred';

@Entity('admissions')
@Index(['tenantId', 'patientId', 'status'])
export class Admission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ type: 'text', name: 'patient_name', transformer: new DataEncryptionTransformer() })
  patientName: string;

  @Column({ type: 'varchar', name: 'bed_id', nullable: true })
  @Index()
  bedId: string;

  @ManyToOne(() => Bed)
  @JoinColumn({ name: 'bed_id' })
  bed: Bed;

  @Column({ name: 'admission_date', type: 'datetime' })
  admissionDate: Date;

  @Column({ name: 'discharge_date', type: 'datetime', nullable: true })
  dischargeDate: Date;

  @Column({ type: 'text', transformer: new DataEncryptionTransformer() })
  reason: string;

  @Column({ type: 'varchar', default: 'Active' })
  status: AdmissionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
