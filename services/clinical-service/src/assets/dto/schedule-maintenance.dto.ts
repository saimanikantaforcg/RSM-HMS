import { IsNotEmpty, IsString, IsOptional, IsIn, IsDateString, MaxLength } from 'class-validator';

export class ScheduleMaintenanceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
