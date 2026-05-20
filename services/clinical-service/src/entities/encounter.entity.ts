import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index
} from 'typeorm';
import { DataEncryptionTransformer } from '../common/transformers/encryption.transformer';

export type EncounterType = 'OPD' | 'IPD' | 'ER' | 'Telemedicine' | 'Surgery';
export type EncounterStatus =
  | 'Planned'
  | 'Arrived'
  | 'InProgress'
  | 'AwaitingLab'
  | 'AwaitingPayment'
  | 'Admitted'
  | 'Discharged'
  | 'Cancelled';

/** Valid forward transitions — enforced in EncountersService */
export const ENCOUNTER_TRANSITIONS: Record<EncounterStatus, EncounterStatus[]> = {
  Planned: ['Arrived', 'Cancelled'],
  Arrived: ['InProgress', 'Cancelled'],
  InProgress: ['AwaitingLab', 'AwaitingPayment', 'Admitted', 'Discharged', 'Cancelled'],
  AwaitingLab: ['InProgress', 'AwaitingPayment', 'Cancelled'],
  AwaitingPayment: ['Discharged', 'Cancelled'],
  Admitted: ['Discharged', 'Cancelled'],
  Discharged: [],
  Cancelled: [],
};

@Entity('encounters')
@Index(['tenantId', 'patientId'])
export class Encounter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ type: 'text', name: 'patient_name', nullable: true, transformer: new DataEncryptionTransformer() })
  patientName: string;

  @Column({ type: 'varchar', name: 'practitioner_id', nullable: true })
  @Index()
  practitionerId: string;

  @Column({ type: 'text', name: 'practitioner_name', nullable: true, transformer: new DataEncryptionTransformer() })
  practitionerName: string;

  @Column({ type: 'varchar', default: 'OPD' })
  @Index()
  type: EncounterType;

  @Column({ type: 'varchar', default: 'Planned' })
  @Index()
  status: EncounterStatus;

  /** Optional FK to appointments.id — set for scheduled visits */
  @Column({ type: 'varchar', name: 'appointment_id', nullable: true })
  appointmentId: string | null;

  /** Optional FK to opd_queue.id — set for OPD walk-ins and check-ins */
  @Column({ type: 'varchar', name: 'opd_queue_id', nullable: true })
  opdQueueId: string | null;

  @Column({ type: 'text', nullable: true, transformer: new DataEncryptionTransformer() })
  diagnosis: string;

  @Column({ type: 'text', name: 'chief_complaint', nullable: true, transformer: new DataEncryptionTransformer() })
  chiefComplaint: string;

  @Column({ name: 'admission_date', type: 'date', nullable: true })
  admissionDate: string;

  @Column({ name: 'discharge_date', type: 'date', nullable: true })
  dischargeDate: string;

  @Column({ type: process.env.DB_TYPE === 'postgres' ? 'jsonb' : 'simple-json', nullable: true })
  vitals: {
    bp?: string;
    hr?: number;
    temp?: number;
    o2?: number;
    weight?: number;
  };

  @Column({ type: 'text', nullable: true, transformer: new DataEncryptionTransformer() })
  notes: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /** Soft-delete: encounters are never physically removed — HIPAA audit requirement */
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
