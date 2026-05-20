import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';
import { DataEncryptionTransformer } from '../common/transformers/encryption.transformer';

export type LabOrderStatus =
  | 'Ordered'
  | 'SampleCollected'
  | 'InProgress'
  | 'ResultEntered'
  | 'Verified'
  | 'Delivered'
  | 'Cancelled';

export type LabOrderPriority = 'Routine' | 'Urgent' | 'STAT';

/** Valid forward transitions per status — enforced in LisService */
export const LAB_ORDER_TRANSITIONS: Record<LabOrderStatus, LabOrderStatus[]> = {
  Ordered: ['SampleCollected', 'Cancelled'],
  SampleCollected: ['InProgress', 'Cancelled'],
  InProgress: ['ResultEntered', 'Cancelled'],
  ResultEntered: ['Verified', 'Cancelled'],
  Verified: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

@Entity('lab_orders')
@Index(['tenantId', 'patientId'])
@Index(['tenantId', 'encounterId'])
export class LabOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  /** FK to encounters.id — mandatory for clinical traceability */
  @Column({ name: 'encounter_id' })
  @Index()
  encounterId: string;

  /** FK to patients.id — replaces name-string join */
  @Column({ name: 'patient_id' })
  @Index()
  patientId: string;

  /** Denormalised for display — source of truth is patients table */
  @Column({ type: 'text', name: 'patient_name', transformer: new DataEncryptionTransformer() })
  patientName: string;

  /** Denormalised MRN for worklist display — never generated here */
  @Column({ type: 'varchar', nullable: true })
  mrn: string;

  @Column({ type: 'text', name: 'test_profile', transformer: new DataEncryptionTransformer() })
  testProfile: string;

  /** Optional FK to lab_test_catalog.id for pricing */
  @Column({ type: 'varchar', name: 'test_catalog_id', nullable: true })
  testCatalogId: string | null;

  @Column({ type: 'varchar', default: 'Routine' })
  priority: LabOrderPriority;

  @Column({ type: 'varchar', default: 'Ordered' })
  @Index()
  status: LabOrderStatus;

  /** User ID of the ordering doctor — never defaults to 'System' */
  @Column({ name: 'ordered_by_id' })
  orderedById: string;

  @Column({ type: 'varchar', name: 'ordered_by_name', nullable: true })
  orderedByName: string;

  /** Result fields — populated when status transitions to 'ResultEntered' */
  @Column({ type: 'text', name: 'result_value', nullable: true, transformer: new DataEncryptionTransformer() })
  resultValue: string | null;

  @Column({ type: 'varchar', name: 'result_unit', nullable: true })
  resultUnit: string | null;

  @Column({ type: 'varchar', name: 'result_interpretation', nullable: true })
  resultInterpretation: string | null; // 'Normal' | 'High' | 'Low' | 'Critical'

  @Column({ type: 'varchar', name: 'resulted_by', nullable: true })
  resultedBy: string | null;

  @Column({ name: 'resulted_at', type: 'datetime', nullable: true })
  resultedAt: Date | null;

  /** User ID of the verifying technician — set on Verified transition */
  @Column({ type: 'varchar', name: 'verified_by_id', nullable: true })
  verifiedById: string | null;

  @Column({ name: 'verified_at', type: 'datetime', nullable: true })
  verifiedAt: Date | null;

  /** Sample collection details */
  @Column({ name: 'sample_collected_at', type: 'datetime', nullable: true })
  sampleCollectedAt: Date | null;

  @Column({ type: 'varchar', name: 'sample_collected_by', nullable: true })
  sampleCollectedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
