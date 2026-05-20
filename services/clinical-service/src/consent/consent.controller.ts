import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConsentService } from './consent.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RecordConsentDto } from './dto/record-consent.dto';

@ApiTags('consent')
@UseGuards(RolesGuard)
@Controller('consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  /** GET /consent/:patientId — full consent history */
  @Get(':patientId')
  @Roles('doctor', 'nurse', 'hospital_admin', 'receptionist')
  @ApiOperation({ summary: 'Get full consent history for a patient (GDPR)' })
  getHistory(@Param('patientId') patientId: string, @Req() req: any) {
    return this.consentService.getHistory(req.tenantId, patientId);
  }

  /** GET /consent/:patientId/current — effective status per consent type */
  @Get(':patientId/current')
  @Roles('doctor', 'nurse', 'hospital_admin', 'receptionist')
  @ApiOperation({ summary: 'Get current effective consent per type' })
  getCurrent(@Param('patientId') patientId: string, @Req() req: any) {
    return this.consentService.getCurrent(req.tenantId, patientId);
  }

  /** POST /consent/:patientId — record a new consent grant/withdrawal */
  @Post(':patientId')
  @Roles('doctor', 'nurse', 'hospital_admin', 'receptionist', 'patient')
  @ApiOperation({ summary: 'Record patient consent or withdrawal (immutable append)' })
  record(
    @Param('patientId') patientId: string,
    @Body() dto: RecordConsentDto,
    @Req() req: any,
  ) {
    const recordedBy = req.user?.email ?? req.user?.userId ?? 'system';
    const ipAddress = req.ip ?? req.headers['x-forwarded-for'] ?? null;
    return this.consentService.record(req.tenantId, patientId, dto, recordedBy, ipAddress);
  }
}
