import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index, ManyToOne, JoinColumn
} from 'typeorm';
import { Stock } from './stock.entity';

export type TransactionType = 'PURCHASE' | 'DISPENSE' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';

@Entity('inventory_transactions')
@Index(['tenantId', 'stockId'])
export class StockTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'stock_id' })
  stockId: string;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @Column({ type: 'varchar' })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantity: number;

  @Column({ type: 'varchar', nullable: true })
  reason: string; // "Dispensed to Patient Arjun Mehta (MRN-8492)"

  @Column({ type: 'varchar', nullable: true, name: 'performed_by' })
  performedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
