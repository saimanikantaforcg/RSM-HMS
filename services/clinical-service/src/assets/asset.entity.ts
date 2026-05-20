import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export type AssetStatus = 'Active' | 'Under Maintenance' | 'Retired' | 'In Use';

@Entity('assets')
@Index(['tenantId', 'department'])
@Index(['tenantId', 'status'])
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  category: string; // e.g. 'Imaging', 'Monitoring', 'Surgical'

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ type: 'varchar', default: 'Active' })
  @Index()
  status: AssetStatus;

  @Column({ type: 'varchar', name: 'next_maintenance', nullable: true })
  nextMaintenance: string | null;

  /** RTLS position (updated by tracking system, not business logic) */
  @Column({ type: 'float', nullable: true })
  posX: number | null;

  @Column({ type: 'float', nullable: true })
  posY: number | null;

  @Column({ type: 'varchar', name: 'last_ping', nullable: true })
  lastPing: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
