import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index
} from 'typeorm';
import { DataEncryptionTransformer } from '../common/transformers/encryption.transformer';

export type PatientGender = 'male' | 'female' | 'other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

@Entity('patients')
@Index(['tenantId', 'mrn'], { unique: true }) // Composite unique: MRN is unique per tenant
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Multi-tenancy: scopes every record to a hospital */
  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ unique: false })
  mrn: string; // unique per tenant — enforced by composite @Index above

  @Column({ type: 'text', name: 'first_name', transformer: new DataEncryptionTransformer() })
  @Index()
  firstName: string;

  @Column({ type: 'text', name: 'last_name', transformer: new DataEncryptionTransformer() })
  @Index()
  lastName: string;

  @Column({ type: 'text', nullable: true, transformer: new DataEncryptionTransformer() })
  @Index()
  dob: string;

  @Column({ type: 'text', name: 'ssn', nullable: true, transformer: new DataEncryptionTransformer() })
  @Index()
  ssn: string; // SSN / Aadhaar (Encrypted)

  @Column({ type: 'varchar', nullable: true })
  gender: PatientGender;

  @Column({ type: 'varchar', name: 'blood_group', nullable: true })
  bloodGroup: BloodGroup;

  @Column({ type: 'text', name: 'contact_number', nullable: true, transformer: new DataEncryptionTransformer() })
  @Index()
  contactNumber: string;

  @Column({ type: 'text', nullable: true, transformer: new DataEncryptionTransformer() })
  email: string;

  @Column({ name: 'emergency_contact', type: process.env.DB_TYPE === 'postgres' ? 'jsonb' : 'simple-json', nullable: true })
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };

  @Column({ type: 'text', nullable: true, transformer: new DataEncryptionTransformer() })
  address: string;

  @Column({ type: 'varchar', nullable: true })
  nationality: string;

  @Column({ type: 'varchar', nullable: true, name: 'insurance_provider' })
  insuranceProvider: string;

  @Column({ type: 'text', nullable: true, name: 'insurance_number', transformer: new DataEncryptionTransformer() })
  insuranceNumber: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /** Soft-delete: records are never physically removed — required for HIPAA audit trail */
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
