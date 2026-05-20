import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { DataEncryptionTransformer } from '../common/transformers/encryption.transformer';

export type ErTriageLevel =
  | 'Level 1 - Resuscitation'
  | 'Level 2 - Emergent'
  | 'Level 3 - Urgent'
  | 'Level 4 - Less Urgent'
  | 'Level 5 - Non-Urgent';

export type ErCaseStatus =
  | 'Triaged'
  | 'In Trauma Bay'
  | 'Awaiting Doctor'
  | 'Under Treatment'
  | 'Admitted'
  | 'Discharged'
  | 'Transferred';

@Entity('er_cases')
@Index(['tenantId', 'createdAt'])
export class ErCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  /** Encrypted — patient may be unknown/anonymous on arrival */
  @Column({ type: 'text', transformer: new DataEncryptionTransformer(), default: 'Unknown' })
  patient: string;

  @Column({ type: 'varchar' })
  level: ErTriageLevel;

  @Column({ type: 'text', transformer: new DataEncryptionTransformer(), nullable: true })
  condition: string;

  @Column({ type: 'varchar', default: 'Triaged' })
  @Index()
  status: ErCaseStatus;

  @Column({ type: 'varchar', name: 'patient_id', nullable: true })
  patientId: string | null;

  @Column({ type: 'varchar', name: 'assigned_doctor_id', nullable: true })
  assignedDoctorId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
