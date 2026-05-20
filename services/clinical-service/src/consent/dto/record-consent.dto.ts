import { IsEnum, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';

const CONSENT_TYPES = ['treatment', 'data_sharing', 'research', 'marketing', 'telemedicine', 'abdm', 'data_retention'] as const;
const CONSENT_STATUSES = ['granted', 'withdrawn'] as const;

export class RecordConsentDto {
  @IsEnum(CONSENT_TYPES)
  consentType: typeof CONSENT_TYPES[number];

  @IsEnum(CONSENT_STATUSES)
  status: typeof CONSENT_STATUSES[number];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  consentText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentVersion?: string;
}
