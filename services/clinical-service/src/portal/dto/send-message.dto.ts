import { IsNotEmpty, IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class SendPortalMessageDto {
  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  subject: string;

  /** Main message content */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;

  /** Alias for body (legacy frontend field) */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;
}
