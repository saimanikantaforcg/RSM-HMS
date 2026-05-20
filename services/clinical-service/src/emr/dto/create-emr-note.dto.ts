import { IsNotEmpty, IsString, IsOptional, IsArray, IsIn, MaxLength, IsUUID } from 'class-validator';

export class CreateEmrNoteDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  patientName?: string;

  /** Legacy field name (frontend may send "patient") */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  patient?: string;

  @IsOptional()
  @IsIn(['Progress Note', 'History & Physical', 'Discharge Summary', 'Operative Note', 'Consultation', 'Nursing Note'])
  type?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(10000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  priority?: string;

  @IsOptional()
  @IsArray()
  orders?: any[];

  @IsOptional()
  @IsArray()
  prescriptions?: any[];
}
