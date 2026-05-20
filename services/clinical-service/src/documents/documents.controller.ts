import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsNotEmpty, IsString, IsOptional, IsIn, IsUUID, MaxLength } from 'class-validator';

class UploadDocumentDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  patient?: string;

  @IsNotEmpty()
  @IsIn(['Lab Report', 'Radiology Report', 'Discharge Summary', 'Consent Form', 'Insurance', 'ID Proof', 'Other'])
  type: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalName?: string;
}

@UseGuards(RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('records')
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  getDocuments(@Req() req: any) {
    return this.documentsService.getDocuments(req.tenantId);
  }

  @Post('upload')
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  uploadDocument(@Req() req: any, @Body() dto: UploadDocumentDto) {
    return this.documentsService.uploadDocument(dto, req.tenantId, req.user?.sub);
  }
}
