import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { DataEncryptionTransformer } from '../common/transformers/encryption.transformer';

export type ReportStatus = 'Draft' | 'Pending' | 'Final' | 'Addendum';
export type Modality = 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound' | 'PET' | 'Mammography' | 'Fluoroscopy' | 'Other';

@Entity('radiology_reports')
@Index(['tenantId', 'patientId'])
@Index(['tenantId', 'createdAt'])
export class RadiologyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', name: 'patient_id', nullable: true })
  patientId: string | null;

  /** Encrypted patient name — may be anonymous on walk-in */
  @Column({ type: 'text', transformer: new DataEncryptionTransformer(), nullable: true })
  patient: string;

  @Column({ type: 'varchar' })
  modality: Modality;

  @Column({ nullable: true })
  region: string; // e.g. 'Brain', 'Chest', 'Abdomen'

  @Column({ type: 'varchar', default: 'Draft' })
  @Index()
  status: ReportStatus;

  @Column({ nullable: true })
  radiologist: string;

  @Column({ type: 'varchar', name: 'radiologist_id', nullable: true })
  radiologistId: string | null;

  /** Encrypted findings / impression text */
  @Column({ type: 'text', nullable: true, transformer: new DataEncryptionTransformer() })
  findings: string;

  /** URL to the stored DICOM/image file */
  @Column({ type: 'varchar', name: 'file_url', nullable: true })
  fileUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
