import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpdController } from './opd.controller';
import { OpdService } from './opd.service';
import { Encounter } from '../entities/encounter.entity';
import { Appointment } from '../entities/appointment.entity';
import { Patient } from '../entities/patient.entity';
import { OpdQueue } from '../entities/opd-queue.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Encounter, Appointment, Patient, OpdQueue]),
    AuditLogModule,
  ],
  controllers: [OpdController],
  providers: [OpdService],
  exports: [OpdService],
})
export class OpdModule {}
