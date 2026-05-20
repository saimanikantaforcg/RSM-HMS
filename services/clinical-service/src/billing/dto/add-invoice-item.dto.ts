import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddInvoiceItemDto {
  @IsString() @IsNotEmpty()
  description: string;

  @IsString() @IsOptional()
  type?: string; // 'Consultation' | 'Diagnostic' | 'Pharmacy' | 'Procedure' | 'Bed'

  @Type(() => Number) @IsNumber() @Min(1)
  quantity: number;

  @Type(() => Number) @IsNumber() @Min(0)
  unitPrice: number;

  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  taxRate?: number;
}
