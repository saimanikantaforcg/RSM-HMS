import { IsNotEmpty, IsString, IsOptional, IsIn, IsUUID } from 'class-validator';

export class RegisterWalkInDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  /** MRN must be provided — never auto-generated server-side */
  @IsNotEmpty()
  @IsString()
  mrn: string;

  @IsOptional()
  @IsIn(['Male', 'Female', 'Other', 'Unknown'])
  gender?: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'])
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsUUID()
  assignedDoctorId?: string;

  @IsOptional()
  @IsString()
  assignedDoctorName?: string;
}
