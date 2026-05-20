import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export type ServiceCategory =
  | 'Consultation'
  | 'Diagnostic'
  | 'Pharmacy'
  | 'Surgery'
  | 'Emergency'
  | 'Physiotherapy'
  | 'Radiology'
  | 'Other';

@Entity('service_catalog')
@Index(['tenantId', 'category'])
@Index(['tenantId', 'isActive'])
export class ServiceCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** null tenantId = global default, overridable per tenant */
  @Column({ type: 'varchar', name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string | null;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'Other' })
  category: ServiceCategory;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 18 })
  taxRate: number; // % e.g. 18 for GST

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', name: 'code', nullable: true })
  code: string | null; // CPT / billing code (optional)

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
