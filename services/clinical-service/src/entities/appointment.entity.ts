import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export type AppointmentType = 'Consultation' | 'Follow-up' | 'Procedure' | 'Telemedicine';
export type AppointmentStatus = 'Scheduled' | 'Arrived' | 'Completed' | 'Cancelled';

@Entity('appointments')
@Index(['tenantId', 'date', 'providerName'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', name: 'patient_id', nullable: true })
  patientId: string;

  @Column({ name: 'patient_name' })
  patientName: string;

  @Column({ name: 'provider_name' })
  providerName: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column()
  time: string; // HH:mm

  @Column({ type: 'varchar', default: 'Consultation' })
  type: AppointmentType;

  @Column({ type: 'varchar', default: 'Scheduled' })
  status: AppointmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
