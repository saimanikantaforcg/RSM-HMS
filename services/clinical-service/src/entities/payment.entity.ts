import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export type RealPaymentMethod = 'Cash' | 'Credit Card' | 'Insurance' | 'M-Pesa' | 'MTN Mobile Money' | 'Wire Transfer' | 'Other';
export type PaymentStatus = 'Success' | 'Failed' | 'Pending';

@Entity('payments')
@Index(['tenantId', 'invoiceId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string; // Reference to the invoice

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tdsDeducted: number; // For Section 194J compliance

  @Column({ type: 'varchar', default: 'Credit Card' })
  paymentMethod: RealPaymentMethod;

  @Column({ type: 'varchar', default: 'Success' })
  status: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  transactionReference: string;

  @CreateDateColumn()
  paymentDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
