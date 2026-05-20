import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';
import { createHash } from 'crypto';

export interface LogEventDto {
  tenantId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  entityName: string;
  entityId?: string;
  changes?: object;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(dto: LogEventDto): Promise<void> {
    try {
      // Fetch the most recent entry to form the hash chain
      const last = await this.auditRepo.findOne({
        where: dto.tenantId ? { tenantId: dto.tenantId } : {},
        order: { createdAt: 'DESC' },
        select: ['entryHash'],
      });
      const prevHash = last?.entryHash ?? '0'.repeat(64);

      const entry = this.auditRepo.create({
        ...dto,
        changes: dto.changes ? JSON.stringify(dto.changes) : undefined,
        prevHash,
      });

      // Persist first to get the auto-generated id and createdAt
      const saved = await this.auditRepo.save(entry);

      // Compute entry hash over immutable fields
      const payload = [
        prevHash,
        saved.id,
        saved.tenantId ?? '',
        saved.userId ?? '',
        saved.action,
        saved.entityName,
        saved.entityId ?? '',
        saved.createdAt.toISOString(),
      ].join('|');

      saved.entryHash = createHash('sha256').update(payload).digest('hex');
      await this.auditRepo.save(saved);
    } catch (err) {
      // Never let audit failures crash the main request
      console.error('[AuditLog] Failed to write audit entry:', err);
    }
  }

  async findByTenant(
    tenantId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const [data, total] = await this.auditRepo.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findByEntity(entityName: string, entityId: string, tenantId: string) {
    return this.auditRepo.find({
      where: { entityName, entityId, tenantId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * PHI Access Tracking: Returns all READ actions for clinical entities.
   */
  async findPhiAccessByTenant(tenantId: string) {
    return this.auditRepo.find({
      where: [
        { tenantId, action: 'READ' as AuditAction, entityName: 'Patient' },
        { tenantId, action: 'READ' as AuditAction, entityName: 'EmrNote' },
      ],
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }
}
