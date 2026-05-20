import { IsNotEmpty, IsString, IsOptional, IsDateString, IsIn, IsBoolean, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class AssignShiftDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsIn(['Morning', 'Afternoon', 'Evening', 'Night', 'On-Call'])
  shiftType?: string;

  /** Legacy alias for shiftType */
  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  /** Legacy alias for department */
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isOnCall?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
