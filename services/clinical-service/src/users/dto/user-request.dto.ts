import { IsNotEmpty, IsString, IsOptional, IsIn, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserRequestDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsNotEmpty()
  @IsIn(['super_admin', 'hospital_admin', 'doctor', 'nurse', 'billing_officer', 'receptionist', 'pharmacist', 'lab_technician', 'hr'])
  role: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsIn(['super_admin', 'hospital_admin', 'doctor', 'nurse', 'billing_officer', 'receptionist', 'pharmacist', 'lab_technician', 'hr'])
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  licenseNumber?: string;
}

export class CreateRosterDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  date: string;

  @IsOptional()
  @IsIn(['Morning', 'Afternoon', 'Evening', 'Night', 'On-Call'])
  shiftType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;
}
