import { IsNotEmpty, IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class LogAuditEntryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  userEmail?: string;

  @IsOptional()
  @IsString()
  userRole?: string;

  @IsNotEmpty()
  @IsIn(['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'PRINT', 'ACCESS'])
  action: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityName?: string;

  /** Alias for entityName (legacy) */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  resource?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;
}
