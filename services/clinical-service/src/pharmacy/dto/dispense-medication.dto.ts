import {
  IsNotEmpty, IsString, IsOptional, IsNumber, IsPositive, IsUUID, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DispenseMedicationDto {
  @ApiProperty({ description: 'FK to prescription_items.id' })
  @IsUUID()
  @IsNotEmpty()
  prescriptionItemId: string;

  @ApiProperty({ description: 'FK to patients.id' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  patientName?: string;

  @ApiProperty({ required: false, description: 'FK to encounters.id — used for invoice item creation' })
  @IsUUID()
  @IsOptional()
  encounterId?: string;

  @ApiProperty({ required: false, description: 'Quantity to dispense — defaults to remaining quantity on item' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiProperty({ required: false, description: 'Unit price from drug catalog — used for invoice item' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiProperty({ required: false, default: 12 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;
}
