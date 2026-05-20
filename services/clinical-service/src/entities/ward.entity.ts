import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index, OneToMany
} from 'typeorm';
import { Bed } from './bed.entity';

@Entity('wards')
export class Ward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column()
  name: string; // e.g., 'General Ward A', 'ICU 1'

  @Column()
  type: string; // 'General', 'ICU', 'Emergency'

  @Column({ name: 'total_beds', type: 'int', default: 0 })
  totalBeds: number;

  @OneToMany(() => Bed, bed => bed.ward)
  beds: Bed[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
