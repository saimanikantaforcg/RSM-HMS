import { IsNotEmpty, IsString, IsOptional, IsDateString, IsIn, IsUUID, MaxLength } from 'class-validator';

export class ScheduleAppointmentDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  patientName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerName?: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  time: string;

  @IsOptional()
  @IsIn(['General', 'Follow-up', 'Specialist', 'Emergency', 'Telemedicine'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
