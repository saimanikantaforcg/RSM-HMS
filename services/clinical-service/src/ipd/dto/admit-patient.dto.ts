import { IsNotEmpty, IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class AdmitPatientDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  dx: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bed?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  consultant?: string;
}
