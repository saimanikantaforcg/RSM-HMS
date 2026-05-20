import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRcmPipelineDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  patient: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  stage: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value: number;
}
