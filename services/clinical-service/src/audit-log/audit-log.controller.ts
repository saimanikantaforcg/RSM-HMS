import { Controller, Get, Query, HttpCode, HttpStatus, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { createHash } from 'crypto';

@ApiTags('audit')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('audit')
export class AuditLogController {
  constructor(private readonly auditService: AuditLogService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('hospital_admin', 'super_admin')
  @ApiOperation({ summary: 'Retrieve audit logs for the current tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLogs(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
  ) {
    return this.auditService.findByTenant(user.tenantId, page, limit);
  }

  @Get('phi-access')
  @HttpCode(HttpStatus.OK)
  @Roles('hospital_admin')
  @ApiOperation({ summary: 'Track PHI access (Who accessed which patient record)' })
  @ApiQuery({ name: 'patientId', required: false })
  async getPhiAccess(
    @CurrentUser() user: any,
    @Query('patientId') patientId?: string,
  ) {
    if (patientId) {
      return this.auditService.findByEntity('Patient', patientId, user.tenantId);
    }
    // Return all READ actions for clinical entities
    return this.auditService.findPhiAccessByTenant(user.tenantId);
  }

  /**
   * GET /audit/verify — walks the hash chain and reports any broken links.
   * A broken link means a record was altered after it was written.
   * Only super_admin can run this (expensive sequential scan).
   */
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Verify audit log hash chain integrity' })
  async verifyChain(@CurrentUser() user: any) {
    const { data } = await this.auditService.findByTenant(user.tenantId, 1, 5000);
    // Traverse oldest-first
    const ordered = [...data].reverse();
    const broken: string[] = [];

    for (const entry of ordered) {
      if (!entry.entryHash) continue; // legacy records before hash chain
      const payload = [
        entry.prevHash ?? '0'.repeat(64),
        entry.id,
        entry.tenantId ?? '',
        entry.userId ?? '',
        entry.action,
        entry.entityName,
        entry.entityId ?? '',
        entry.createdAt.toISOString(),
      ].join('|');
      const expected = createHash('sha256').update(payload).digest('hex');
      if (expected !== entry.entryHash) broken.push(entry.id);
    }

    return {
      checked: ordered.filter(e => e.entryHash).length,
      intact: broken.length === 0,
      brokenIds: broken,
    };
  }
}
