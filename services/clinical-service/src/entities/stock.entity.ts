import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

@Entity('stocks')
@Index(['tenantId', 'itemName'])
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'item_name' })
  itemName: string;

  @Column({ default: 'Drug' }) // Drug, Supply, Asset
  category: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  quantity: number;

  @Column({ type: 'varchar', nullable: true })
  unit: string; // Tabs, Vials, Boxes

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 10, name: 'reorder_level' })
  reorderLevel: number;

  @Column({ type: 'varchar', nullable: true, name: 'expiry_date' })
  expiryDate: Date;

  @Column({ type: 'varchar', nullable: true })
  location: string; // Pharmacy A, Main Store

  @Column({ type: 'varchar', nullable: true })
  supplier: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
