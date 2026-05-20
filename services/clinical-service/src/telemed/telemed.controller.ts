import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { TelemedService } from './telemed.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

class JoinSessionDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  patientName?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerName?: string;
}

@UseGuards(RolesGuard)
@Controller('telemed')
export class TelemedController {
  constructor(private readonly telemedService: TelemedService) {}

  @Get('sessions')
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  getSessions(@Req() req: any) {
    return this.telemedService.getSessions(req.tenantId);
  }

  @Post('join')
  @Roles('doctor', 'nurse', 'hospital_admin')
  joinSession(@Req() req: any, @Body() dto: JoinSessionDto) {
    return this.telemedService.joinSession(dto, req.tenantId);
  }
}
