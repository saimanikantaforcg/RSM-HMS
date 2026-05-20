import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

@Entity('lab_test_catalog')
@Index(['tenantId', 'testCode'], { unique: true })
export class LabTestCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  /** Short billing code e.g. "CBC", "LFT", "TSH" */
  @Column({ name: 'test_code' })
  testCode: string;

  @Column({ name: 'test_name' })
  testName: string;

  /** Category for grouping e.g. "Haematology", "Biochemistry", "Microbiology" */
  @Column({ type: 'varchar', nullable: true })
  category: string;

  /** Description for the lab worklist */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** Billing price — used for auto-invoice creation */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 18, name: 'tax_rate' })
  taxRate: number;

  /** Expected turnaround in hours */
  @Column({ type: 'int', default: 24, name: 'turnaround_hours' })
  turnaroundHours: number;

  /** Sample type e.g. "Blood", "Urine", "Swab", "Stool" */
  @Column({ type: 'varchar', name: 'sample_type', nullable: true })
  sampleType: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'requires_fasting' })
  requiresFasting: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
