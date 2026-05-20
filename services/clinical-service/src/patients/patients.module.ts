import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../entities/patient.entity';
import { Encounter } from '../entities/encounter.entity';
import { Prescription } from '../entities/prescription.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { VitalSign } from '../entities/vital-sign.entity';
import { EmrNote } from '../entities/emr-note.entity';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { PatientsCacheService } from './patients-cache.service';
import { RedisModule } from '../common/redis/redis.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Patient, Encounter, Prescription, LabOrder, VitalSign, EmrNote]),
        RedisModule,
    ],
    controllers: [PatientsController],
    providers: [PatientsService, PatientsCacheService],
    exports: [PatientsService],
})
export class PatientsModule { }
