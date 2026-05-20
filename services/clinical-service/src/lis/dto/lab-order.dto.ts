import {
  IsNotEmpty, IsString, IsOptional, IsIn, MaxLength, IsUUID,
} from 'class-validator';

export class CreateLabOrderDto {
  @IsUUID()
  @IsNotEmpty()
  encounterId: string;

  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  patientName: string;

  /** Denormalised MRN from patient record — never auto-generated */
  @IsString()
  @IsOptional()
  @MaxLength(30)
  mrn?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  test: string;

  /** Optional FK to lab_test_catalog.id for pricing */
  @IsUUID()
  @IsOptional()
  testCatalogId?: string;

  @IsOptional()
  @IsIn(['Routine', 'Urgent', 'STAT'])
  priority?: string;
}

export class EnterResultDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  resultValue: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  resultUnit?: string;

  @IsOptional()
  @IsIn(['Normal', 'High', 'Low', 'Critical'])
  resultInterpretation?: string;
}
