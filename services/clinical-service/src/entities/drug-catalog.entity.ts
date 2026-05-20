import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

@Entity('drug_catalog')
@Index(['tenantId', 'drugCode'], { unique: true })
export class DrugCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  /** Unique drug code per tenant e.g. "AMOX-500", "METF-500" */
  @Column({ name: 'drug_code' })
  drugCode: string;

  @Column({ name: 'generic_name' })
  genericName: string;

  @Column({ type: 'varchar', name: 'brand_name', nullable: true })
  brandName: string | null;

  /** Therapeutic category e.g. "Antibiotic", "Antidiabetic", "Analgesic" */
  @Column({ type: 'varchar', nullable: true })
  category: string;

  /** Dosage form e.g. "Tablet", "Capsule", "Syrup", "Injection" */
  @Column({ type: 'varchar', nullable: true })
  form: string;

  /** Strength e.g. "500mg", "10ml" */
  @Column({ type: 'varchar', nullable: true })
  strength: string;

  /** Dispensing unit for stock management e.g. "Tablet", "Bottle", "Vial" */
  @Column({ type: 'varchar', name: 'dispensing_unit', nullable: true })
  dispensingUnit: string;

  /** Unit price for auto-invoice generation */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 12, name: 'tax_rate' })
  taxRate: number;

  /** Whether this drug requires a prescription */
  @Column({ type: 'boolean', default: true, name: 'requires_prescription' })
  requiresPrescription: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  /** Reorder threshold — used for low-stock alerts */
  @Column({ type: 'int', default: 10, name: 'reorder_level' })
  reorderLevel: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
