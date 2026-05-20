import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';
import { DataEncryptionTransformer } from '../common/transformers/encryption.transformer';

export type EmrNoteType = 'Progress Note' | 'Discharge Summary' | 'History & Physical' | 'Other';
export type EmrNoteStatus = 'Draft' | 'Signed' | 'Amended';

@Entity('emr_notes')
@Index(['tenantId', 'patientId'])
export class EmrNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ type: 'text', name: 'patient_name', transformer: new DataEncryptionTransformer() })
  patientName: string;

  @Column()
  author: string; // Doctor Name

  @Column({ type: 'varchar', default: 'Progress Note' })
  type: EmrNoteType;

  @Column({ type: 'text', transformer: new DataEncryptionTransformer() })
  content: string;

  @Column({ type: 'varchar', default: 'Draft' })
  status: EmrNoteStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
