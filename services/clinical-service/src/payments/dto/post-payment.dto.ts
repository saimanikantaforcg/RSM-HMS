import { IsNotEmpty, IsString, IsNumber, Min, IsIn, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PostPaymentDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  ref: string;

  @IsOptional()
  @IsIn(['Cash', 'Card', 'UPI', 'Insurance', 'Cheque', 'Online'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  patientId?: string;
}
