import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { Stock } from '../entities/stock.entity';
import { StockTransaction } from '../entities/stock-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stock, StockTransaction])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
