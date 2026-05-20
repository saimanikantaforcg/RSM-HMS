import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index, OneToMany
} from 'typeorm';
import { DataEncryptionTransformer } from '../common/transformers/encryption.transformer';
import { PrescriptionItem } from './prescription-item.entity';

/**
 * Clinical prescription workflow states.
 * Previous value ('Transmitted' | 'Queued' | 'Failed') described e-Rx routing — replaced.
 */
export type PrescriptionStatus =
  | 'Draft'
  | 'Signed'
  | 'PartiallyDispensed'
  | 'Dispensed'
  | 'Cancelled';

/** Valid forward transitions per status — enforced in PrescriptionService */
export const PRESCRIPTION_TRANSITIONS: Record<PrescriptionStatus, PrescriptionStatus[]> = {
  Draft: ['Signed', 'Cancelled'],
  Signed: ['PartiallyDispensed', 'Dispensed', 'Cancelled'],
  PartiallyDispensed: ['Dispensed', 'Cancelled'],
  Dispensed: [],
  Cancelled: [],
};

@Entity('prescriptions')
@Index(['tenantId', 'patientId'])
@Index(['tenantId', 'encounterId'])
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  /** FK to encounters.id — mandatory for clinical traceability */
  @Column({ name: 'encounter_id' })
  @Index()
  encounterId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ type: 'text', name: 'patient_name', transformer: new DataEncryptionTransformer() })
  patientName: string;

  /** Prescribing doctor's user ID */
  @Column({ name: 'prescribed_by_id' })
  prescribedById: string;

  @Column({ type: 'varchar', name: 'prescribed_by_name', nullable: true })
  prescribedByName: string;

  /** Overall prescription notes / instructions for the pharmacist */
  @Column({ type: 'text', nullable: true, transformer: new DataEncryptionTransformer() })
  notes: string;

  @Column({ type: 'varchar', default: 'Draft' })
  @Index()
  status: PrescriptionStatus;

  /** Individual drug lines — required for multi-drug prescriptions and partial dispense */
  @OneToMany(() => PrescriptionItem, (item) => item.prescription, {
    cascade: true,
    eager: true,
  })
  items: PrescriptionItem[];

  @CreateDateColumn()
  prescribedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
