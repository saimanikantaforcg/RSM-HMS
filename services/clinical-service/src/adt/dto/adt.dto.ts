import { IsNotEmpty, IsString, IsOptional, IsIn, IsUUID, MaxLength } from 'class-validator';

export class TransferPatientDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  patient: string;

  @IsNotEmpty()
  @IsIn(['Admit', 'Transfer', 'Discharge'])
  action: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fromLoc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  toLoc?: string;
}

export class AdmitBedDto {
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  patientName: string;

  @IsNotEmpty()
  @IsUUID()
  bedId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
