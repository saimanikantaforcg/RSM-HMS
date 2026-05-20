import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsIn, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AddStockDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  itemName: string;

  @IsOptional()
  @IsIn(['Drug', 'Consumable', 'Equipment', 'Reagent', 'PPE', 'Implant'])
  category?: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;
}
