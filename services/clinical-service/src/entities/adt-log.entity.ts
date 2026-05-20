import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index
} from 'typeorm';
import { DataEncryptionTransformer } from '../common/transformers/encryption.transformer';

export type AdtAction = 'Admission' | 'Transfer' | 'Discharge';

@Entity('adt_logs')
@Index(['tenantId', 'patientId'])
export class AdtLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ type: 'text', name: 'patient_name', transformer: new DataEncryptionTransformer() })
  patientName: string;

  @Column({ type: 'varchar' })
  action: AdtAction;

  @Column({ type: 'varchar', name: 'from_location', nullable: true })
  fromLocation: string;

  @Column({ type: 'varchar', name: 'to_location', nullable: true })
  toLocation: string;

  @Column({ name: 'operator_user' })
  operatorUser: string;

  @CreateDateColumn()
  createdAt: Date;
}
