import {
  Entity, PrimaryGeneratedColumn, Column,
  UpdateDateColumn, Index
} from 'typeorm';

@Entity('hospital_settings')
export class HospitalSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', unique: true })
  @Index()
  tenantId: string;

  @Column({ name: 'hospital_name', default: 'General Hospital' })
  hospitalName: string;

  @Column({ default: 'Dark Mode' })
  theme: string;

  @Column({ name: 'auto_logout', default: 15 })
  autoLogout: number;

  @Column({ default: true })
  notifications: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
