import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RecordVitalsDto {
  @ApiProperty({ example: 'pat-uuid', description: 'Patient UUID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: '120/80', description: 'Blood Pressure (systolic/diastolic)' })
  @IsString()
  @IsOptional()
  bp?: string;

  @ApiProperty({ example: 72, description: 'Heart Rate (bpm)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(300)
  hr?: number;

  @ApiProperty({ example: 37.0, description: 'Body Temperature (°C)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(25)
  @Max(45)
  temp?: number;

  @ApiProperty({ required: false, example: 98, description: 'Oxygen Saturation (SpO2 %)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  @Max(100)
  spo2?: number;

  /** Frontend alias for spo2 */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  @Max(100)
  o2?: number;

  @ApiProperty({ required: false, example: 16, description: 'Respiratory Rate (breaths/min)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  rr?: number;

  @ApiProperty({ required: false, example: 70, description: 'Weight (kg)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(500)
  weight?: number;

  @IsOptional()
  @IsString()
  author?: string;
}

