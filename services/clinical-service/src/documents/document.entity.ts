import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { DataEncryptionTransformer } from '../common/transformers/encryption.transformer';

export type DocumentType =
  | 'Insurance Card'
  | 'ID Proof'
  | 'Consent Form'
  | 'Discharge Summary'
  | 'Lab Report'
  | 'Radiology Report'
  | 'Prescription'
  | 'Referral Letter'
  | 'Other';

export type DocumentStatus = 'Active' | 'Archived' | 'Pending Review';

@Entity('documents')
@Index(['tenantId', 'patientId'])
@Index(['tenantId', 'createdAt'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', name: 'patient_id', nullable: true })
  patientId: string | null;

  /** Encrypted patient name */
  @Column({ type: 'text', nullable: true, transformer: new DataEncryptionTransformer() })
  patient: string;

  @Column({ type: 'varchar' })
  type: DocumentType;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'varchar', name: 'original_name', nullable: true })
  originalName: string | null;

  @Column({ type: 'varchar', default: 'Active' })
  status: DocumentStatus;

  @Column({ type: 'varchar', name: 'uploaded_by', nullable: true })
  uploadedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
