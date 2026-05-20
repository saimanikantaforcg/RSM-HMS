import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUUID, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitClaimDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  patient: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  payer: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  patientId?: string;
}

export class SettleBatchDto {
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  claimIds: string[];

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  transactionRef: string;
}
