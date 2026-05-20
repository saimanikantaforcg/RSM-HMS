import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class ScheduleSurgeryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  patient: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  procedure: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  time?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  room?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  surgeon?: string;
}
