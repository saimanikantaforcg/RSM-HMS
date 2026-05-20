import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index, OneToMany
} from 'typeorm';
import { InvoiceItem } from './invoice-item.entity';


export type InvoiceStatus = 'Draft' | 'Pending' | 'PartiallyPaid' | 'Paid' | 'Cancelled' | 'Refunded';
export type PaymentMethod = 'Cash' | 'Card' | 'Insurance' | 'Mobile';

@Entity('invoices')
@Index(['tenantId', 'patientId'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ type: 'varchar', name: 'patient_name', nullable: true })
  patientName: string;

  @Column({ type: 'varchar', name: 'encounter_id', nullable: true })
  encounterId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  netAmount: number;

  /** Running total of payments collected — updated atomically on each payment */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'paid_amount' })
  paidAmount: number;

  @Column({ type: 'varchar', default: 'Draft' })
  status: InvoiceStatus;

  @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true, eager: true })
  items: InvoiceItem[];

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'varchar', nullable: true, name: 'payment_method' })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
