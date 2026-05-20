import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EprescribingController } from './eprescribing.controller';
import { EprescribingService } from './eprescribing.service';
import { Prescription } from '../entities/prescription.entity';
import { PrescriptionItem } from '../entities/prescription-item.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prescription, PrescriptionItem]),
    AuditLogModule,
  ],
  controllers: [EprescribingController],
  providers: [EprescribingService],
  exports: [EprescribingService],
})
export class EprescribingModule {}
