import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ApplyDiscountDto {
  @Type(() => Number) @IsNumber() @Min(0) @Max(100)
  discount: number; // Percentage 0–100
}
