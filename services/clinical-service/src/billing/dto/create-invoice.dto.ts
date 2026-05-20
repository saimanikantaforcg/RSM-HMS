import { IsUUID, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID() @IsNotEmpty()
  encounterId: string;

  @IsUUID() @IsNotEmpty()
  patientId: string;

  @IsString() @IsOptional()
  patientName?: string;

  @IsString() @IsOptional()
  notes?: string;
}
