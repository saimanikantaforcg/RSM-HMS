import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateReportDto {
  @ApiProperty({ example: 'Monthly Patient Volume' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Clinical', description: 'Type of report: Clinical, Financial, etc.' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  author?: string;
}
