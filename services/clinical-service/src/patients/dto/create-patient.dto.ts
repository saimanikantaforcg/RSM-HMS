import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsObject, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { BloodGroup } from '../../entities/patient.entity';

const BloodGroupValues = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export class CreatePatientDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ required: false, example: '1990-01-01' })
  @IsString()
  @IsOptional()
  dob?: string;

  @ApiProperty({ required: false, enum: ['male', 'female', 'other'] })
  @IsEnum(['male', 'female', 'other'])
  @IsOptional()
  gender?: 'male' | 'female' | 'other';

  @ApiProperty({ required: false, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] })
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  @IsOptional()
  bloodGroup?: BloodGroup;

  @ApiProperty({ required: false })
  @IsString()
  @Matches(/^\+?[0-9\-\s()]+$/, { message: 'Contact number must be a valid phone number format' })
  @IsOptional()
  contactNumber?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  insuranceNumber?: string;

  @IsOptional()
  emergencyContact?: { name: string; relationship: string; phone: string };

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  encounterType?: string;
}
