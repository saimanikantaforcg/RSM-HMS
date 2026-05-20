import { IsEnum, IsNotEmpty, IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CollectPaymentDto {
  @Type(() => Number) @IsNumber() @Min(0.01)
  amount: number;

  @IsEnum(['Cash', 'Card', 'Insurance', 'Mobile'])
  method: 'Cash' | 'Card' | 'Insurance' | 'Mobile';

  @IsString() @IsOptional()
  reference?: string; // Card transaction ID, mobile receipt, etc.

  @IsString() @IsOptional()
  notes?: string;
}
