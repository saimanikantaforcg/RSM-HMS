import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LogAuditEntryDto } from './dto/log-audit-entry.dto';

@UseGuards(RolesGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('audit')
  @Roles('hospital_admin', 'super_admin')
  getAuditLogs(@Req() req: any) {
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 50;
    return this.complianceService.getAuditLogs(req.tenantId, page, limit);
  }

  @Post('log')
  @Roles('hospital_admin', 'super_admin')
  logAuditEntry(@Req() req: any, @Body() dto: LogAuditEntryDto) {
    return this.complianceService.logAuditEntry(dto, req.tenantId);
  }
}
