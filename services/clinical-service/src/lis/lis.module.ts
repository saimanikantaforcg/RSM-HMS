import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LisController } from './lis.controller';
import { LisService } from './lis.service';
import { LabOrder } from '../entities/lab-order.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LabOrder]),
    AuditLogModule,
  ],
  controllers: [LisController],
  providers: [LisService],
  exports: [LisService],
})
export class LisModule {}
