import { IsNotEmpty, IsString, IsOptional, IsIn, IsUUID, MaxLength } from 'class-validator';

export class UploadRadiologyReportDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  patient?: string;

  @IsNotEmpty()
  @IsIn(['CT', 'MRI', 'X-Ray', 'Ultrasound', 'PET', 'Mammography', 'Fluoroscopy'])
  modality: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  radiologist?: string;

  @IsOptional()
  @IsUUID()
  radiologistId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  findings?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  fileUrl?: string;
}
