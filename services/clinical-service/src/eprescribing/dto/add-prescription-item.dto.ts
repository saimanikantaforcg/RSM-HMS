import { IsString, IsNotEmpty, IsOptional, IsInt, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPrescriptionItemDto {
  @ApiProperty({ example: 'Amoxicillin' })
  @IsString()
  @IsNotEmpty()
  drugName: string;

  @ApiProperty({ required: false, description: 'FK to drug_catalog.id' })
  @IsUUID()
  @IsOptional()
  drugCatalogId?: string;

  @ApiProperty({ required: false, example: '500mg' })
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiProperty({ required: false, example: 'BD' })
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiProperty({ required: false, example: '5 days' })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiProperty({ required: false, example: 'Oral' })
  @IsString()
  @IsOptional()
  route?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantityOrdered?: number;

  @ApiProperty({ required: false, example: 'Take with food' })
  @IsString()
  @IsOptional()
  instructions?: string;
}
