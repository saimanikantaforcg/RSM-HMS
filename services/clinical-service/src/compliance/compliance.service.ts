import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/audit-log.entity';

@Injectable()
export class ComplianceService {
  constructor(private readonly auditLogService: AuditLogService) {}

  async getAuditLogs(tenantId: string, page = 1, limit = 50) {
    return this.auditLogService.findByTenant(tenantId, page, limit);
  }

  async logAuditEntry(data: any, tenantId: string) {
    await this.auditLogService.log({
      tenantId,
      userId: data.userId,
      userEmail: data.userEmail,
      userRole: data.userRole,
      action: (data.action ?? 'CREATE') as AuditAction,
      entityName: data.entityName ?? data.resource,
      entityId: data.entityId,
      notes: data.notes,
      ipAddress: data.ipAddress,
    });
    return { success: true };
  }
}
