import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

@Entity('vital_signs')
@Index(['tenantId', 'patientId'])
export class VitalSign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'patient_id' })
  @Index()
  patientId: string;

  @Column({ type: 'varchar', nullable: true })
  bp: string; // Blood Pressure e.g. 120/80

  @Column({ type: 'varchar', nullable: true })
  hr: string; // Heart Rate

  @Column({ type: 'varchar', nullable: true })
  spo2: string; // Oxygen Saturation

  @Column({ nullable: true, type: 'varchar' })
  temp: string; // Temperature

  @Column({ type: 'varchar', nullable: true })
  rr: string; // Respiratory Rate

  @Column({ type: 'varchar', nullable: true })
  weight: string;

  @Column({ type: 'varchar', name: 'recorded_by', nullable: true })
  recordedBy: string;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
