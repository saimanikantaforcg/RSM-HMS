import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AbdmService } from './abdm.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsNotEmpty, IsString, IsOptional, IsUUID, Matches, MaxLength } from 'class-validator';

class GenerateAbhaDto {
  /** 12-digit Aadhaar number — required for KYC */
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{12}$/, { message: 'aadhaar must be a 12-digit number' })
  aadhaar: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  patientName: string;

  @IsOptional()
  @IsString()
  patientId?: string;
}

class RequestConsentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  abhaAddress: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  purpose?: string;
}

@UseGuards(RolesGuard)
@Controller('abdm')
export class AbdmController {
  constructor(private readonly abdmService: AbdmService) {}

  @Get('profiles')
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  getProfiles(@Req() req: any) {
    return this.abdmService.getProfiles(req.tenantId);
  }

  @Post('generate-abha')
  @Roles('receptionist', 'hospital_admin')
  generateAbha(@Req() req: any, @Body() dto: GenerateAbhaDto) {
    return this.abdmService.generateAbha(req.tenantId, dto);
  }

  @Post('request-consent')
  @Roles('doctor', 'hospital_admin')
  requestConsent(@Req() req: any, @Body() dto: RequestConsentDto) {
    return this.abdmService.requestConsent(req.tenantId, dto);
  }
}

