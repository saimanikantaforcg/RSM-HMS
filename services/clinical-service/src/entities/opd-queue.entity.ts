import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export type OpdQueueStatus =
  | 'Waiting'
  | 'Called'
  | 'InConsultation'
  | 'Completed'
  | 'Skipped'
  | 'Left';

/** Valid forward transitions — enforced in OpdService */
export const OPD_QUEUE_TRANSITIONS: Record<OpdQueueStatus, OpdQueueStatus[]> = {
  Waiting: ['Called', 'Skipped', 'Left'],
  Called: ['InConsultation', 'Skipped', 'Left'],
  InConsultation: ['Completed'],
  Completed: [],
  Skipped: ['Called', 'Left'],
  Left: [],
};

@Entity('opd_queue')
@Index(['tenantId', 'departmentId'])
@Index(['tenantId', 'encounterId'], { unique: true })
export class OpdQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  /** FK to encounters.id */
  @Column({ name: 'encounter_id' })
  @Index()
  encounterId: string;

  /** FK to patients.id */
  @Column({ name: 'patient_id' })
  @Index()
  patientId: string;

  /** Denormalised for display */
  @Column({ type: 'varchar', name: 'patient_name', nullable: true })
  patientName: string;

  /** Denormalised MRN for display */
  @Column({ type: 'varchar', nullable: true })
  mrn: string;

  /** Optional FK to appointments.id — null for walk-ins */
  @Column({ type: 'varchar', name: 'appointment_id', nullable: true })
  appointmentId: string | null;

  /** FK to departments.id */
  @Column({ type: 'varchar', name: 'department_id', nullable: true })
  departmentId: string | null;

  @Column({ type: 'varchar', name: 'department_name', nullable: true })
  departmentName: string;

  /** Assigned doctor FK to users.id */
  @Column({ type: 'varchar', name: 'assigned_doctor_id', nullable: true })
  assignedDoctorId: string | null;

  @Column({ type: 'varchar', name: 'assigned_doctor_name', nullable: true })
  assignedDoctorName: string | null;

  /** Sequential token number for display e.g. "OPD-042" */
  @Column({ type: 'varchar', name: 'token_number', nullable: true })
  tokenNumber: string;

  @Column({ type: 'varchar', default: 'Waiting' })
  @Index()
  status: OpdQueueStatus;

  /** When the patient was called from waiting to consultation */
  @Column({ name: 'called_at', type: 'datetime', nullable: true })
  calledAt: Date | null;

  /** When consultation started */
  @Column({ name: 'consultation_started_at', type: 'datetime', nullable: true })
  consultationStartedAt: Date | null;

  /** When the queue entry was completed */
  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;

  /** Patient-reported chief complaint at triage */
  @Column({ type: 'text', name: 'chief_complaint', nullable: true })
  chiefComplaint: string;

  @Column({ type: 'int', default: 0, name: 'wait_minutes' })
  waitMinutes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
