import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { EncounterType } from '../../entities/encounter.entity';

export class CreateEncounterDto {
  @ApiProperty({ example: 'patient-uuid' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  patientName?: string;

  @ApiProperty({ required: false, description: 'Attending doctor user ID' })
  @IsUUID()
  @IsOptional()
  practitionerId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  practitionerName?: string;

  @ApiProperty({ required: false, enum: ['OPD', 'IPD', 'ER', 'Telemedicine', 'Surgery'] })
  @IsEnum(['OPD', 'IPD', 'ER', 'Telemedicine', 'Surgery'])
  @IsOptional()
  type?: EncounterType;

  @ApiProperty({ required: false, description: 'FK to appointments.id' })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ required: false, description: 'FK to opd_queue.id' })
  @IsUUID()
  @IsOptional()
  opdQueueId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @ApiProperty({ required: false, example: '2026-05-20' })
  @IsString()
  @IsOptional()
  admissionDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string;
}
