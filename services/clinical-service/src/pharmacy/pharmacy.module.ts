import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyService } from './pharmacy.service';
import { PharmacyDispense } from '../entities/pharmacy-dispense.entity';
import { Prescription } from '../entities/prescription.entity';
import { PrescriptionItem } from '../entities/prescription-item.entity';
import { Stock } from '../entities/stock.entity';
import { StockTransaction } from '../entities/stock-transaction.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Invoice } from '../entities/invoice.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PharmacyDispense,
      Prescription,
      PrescriptionItem,
      Stock,
      StockTransaction,
      InvoiceItem,
      Invoice,
    ]),
    AuditLogModule,
  ],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
