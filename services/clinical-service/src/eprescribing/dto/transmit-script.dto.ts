import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class TransmitScriptDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  patient: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  medication: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pharmacy?: string;
}
