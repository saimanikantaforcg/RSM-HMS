import { IsNotEmpty, IsString, IsOptional, IsIn, IsUUID, MaxLength } from 'class-validator';

export class TriageCaseDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  patient: string;

  @IsNotEmpty()
  @IsIn([
    'Level 1 - Resuscitation',
    'Level 2 - Emergent',
    'Level 3 - Urgent',
    'Level 4 - Less Urgent',
    'Level 5 - Non-Urgent',
  ])
  level: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  condition?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  assignedDoctorId?: string;
}
