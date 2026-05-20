import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Stock } from '../entities/stock.entity';
import { StockTransaction, TransactionType } from '../entities/stock-transaction.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    @InjectRepository(StockTransaction)
    private readonly transactionRepo: Repository<StockTransaction>,
  ) {}

  async getStockList(tenantId: string) {
    return await this.stockRepo.find({
      where: { tenantId },
      order: { itemName: 'ASC' },
      take: 200,
    });
  }

  async getLowStockAlerts(tenantId: string) {
    // Items where quantity <= reorderLevel
    const all = await this.stockRepo.find({ where: { tenantId } });
    return all.filter(s => Number(s.quantity) <= Number(s.reorderLevel));
  }

  async addStock(tenantId: string, data: any) {
    let stock = await this.stockRepo.findOne({
      where: { tenantId, itemName: data.itemName }
    });

    if (!stock) {
      stock = this.stockRepo.create({
        tenantId,
        itemName: data.itemName,
        category: data.category || 'Drug',
        quantity: 0,
        unit: data.unit || 'Tabs',
        reorderLevel: data.reorderLevel || 10,
        expiryDate: data.expiryDate,
        supplier: data.supplier,
      });
    }

    const addedQty = parseFloat(data.quantity || '0');
    stock.quantity = Number(stock.quantity) + addedQty;
    const saved = await this.stockRepo.save(stock);

    // Record Transaction
    await this.transactionRepo.save(this.transactionRepo.create({
      tenantId,
      stockId: saved.id,
      type: 'PURCHASE',
      quantity: addedQty,
      reason: data.reason || 'Restock / Purchase',
      performedBy: data.author
    }));

    return saved;
  }

  async deductStock(tenantId: string, itemName: string, qty: number, reason: string, user: string) {
    const stock = await this.stockRepo.findOne({
      where: { tenantId, itemName },
    });

    if (!stock) throw new Error(`Stock not found for item: ${itemName}`);
    if (Number(stock.quantity) < qty) throw new Error(`Insufficient stock for ${itemName}`);

    stock.quantity = Number(stock.quantity) - qty;
    const saved = await this.stockRepo.save(stock);

    // Record Transaction
    await this.transactionRepo.save(this.transactionRepo.create({
      tenantId,
      stockId: saved.id,
      type: 'DISPENSE',
      quantity: -qty,
      reason,
      performedBy: user
    }));

    return saved;
  }
}
