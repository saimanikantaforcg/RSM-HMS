import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Prescription } from './prescription.entity';

export type PrescriptionItemStatus = 'Pending' | 'PartiallyDispensed' | 'Dispensed' | 'Cancelled';

@Entity('prescription_items')
@Index(['tenantId', 'prescriptionId'])
export class PrescriptionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'prescription_id' })
  @Index()
  prescriptionId: string;

  @ManyToOne(() => Prescription, (rx) => rx.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;

  /** Generic drug name — used for stock lookup and dispense */
  @Column({ name: 'drug_name' })
  drugName: string;

  /** Optional FK to drug_catalog.id for price and stock linkage */
  @Column({ type: 'varchar', name: 'drug_catalog_id', nullable: true })
  drugCatalogId: string | null;

  /** Dosage string e.g. "500mg" */
  @Column({ type: 'varchar', nullable: true })
  dosage: string;

  /** Dosing frequency e.g. "1-0-1", "TID", "BD" */
  @Column({ type: 'varchar', nullable: true })
  frequency: string;

  /** Duration e.g. "5 days" */
  @Column({ type: 'varchar', nullable: true })
  duration: string;

  /** Route of administration e.g. "Oral", "IV", "Topical" */
  @Column({ type: 'varchar', nullable: true })
  route: string;

  /** Total quantity ordered */
  @Column({ type: 'int', name: 'quantity_ordered', default: 1 })
  quantityOrdered: number;

  /** Running count of units already dispensed — updated on each dispense */
  @Column({ type: 'int', name: 'quantity_dispensed', default: 0 })
  quantityDispensed: number;

  /** Special instructions for this drug (e.g. "Take with food") */
  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'varchar', default: 'Pending' })
  @Index()
  status: PrescriptionItemStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
