import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export type DepartmentType = 'OPD' | 'IPD' | 'ER' | 'ICU' | 'OT' | 'Lab' | 'Pharmacy' | 'Radiology' | 'Admin';

@Entity('departments')
@Index(['tenantId', 'code'], { unique: true })
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column()
  name: string;

  /** Short code e.g. "CARD", "ORTHO", "PEDI" — unique per tenant */
  @Column()
  code: string;

  @Column({ type: 'varchar', default: 'OPD' })
  type: DepartmentType;

  /** FK to users.id — head of department */
  @Column({ type: 'varchar', name: 'head_doctor_id', nullable: true })
  headDoctorId: string | null;

  @Column({ type: 'varchar', name: 'head_doctor_name', nullable: true })
  headDoctorName: string | null;

  @Column({ type: 'int', default: 0, name: 'daily_opd_capacity' })
  dailyOpdCapacity: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
