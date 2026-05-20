import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max, IsIn, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  hospitalName?: string;

  @IsOptional()
  @IsIn(['Dark Mode', 'Light Mode', 'System'])
  theme?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(120)
  autoLogout?: number;

  @IsOptional()
  @IsBoolean()
  notifications?: boolean;
}
