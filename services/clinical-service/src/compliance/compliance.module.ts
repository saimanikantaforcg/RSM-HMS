import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { DataRetentionService } from './data-retention.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuditLog } from '../audit-log/audit-log.entity';
import { Notification } from '../entities/notification.entity';

@Module({
  imports: [
    AuditLogModule,
    TypeOrmModule.forFeature([AuditLog, Notification]),
  ],
  controllers: [ComplianceController],
  providers: [ComplianceService, DataRetentionService],
  exports: [DataRetentionService],
})
export class ComplianceModule {}
