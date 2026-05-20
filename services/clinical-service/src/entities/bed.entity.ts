import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn
} from 'typeorm';
import { Ward } from './ward.entity';

export type BedStatus = 'Available' | 'Occupied' | 'Maintenance';

@Entity('beds')
export class Bed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'ward_id' })
  @Index()
  wardId: string;

  @ManyToOne(() => Ward, ward => ward.beds)
  @JoinColumn({ name: 'ward_id' })
  ward: Ward;

  @Column({ name: 'bed_number' })
  bedNumber: string;

  @Column({ type: 'varchar', default: 'Available' })
  status: BedStatus;

  @Column({ name: 'current_patient_id', type: 'varchar', nullable: true })
  currentPatientId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
