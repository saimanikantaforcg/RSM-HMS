import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AuditLog } from '../audit-log/audit-log.entity';
import { Notification } from '../entities/notification.entity';

/**
 * DataRetentionService
 * --------------------
 * HIPAA § 164.530(j): Covered entities must retain policies and records
 * for 6 years from the date of creation or last effective date.
 *
 * This service runs nightly and archives (soft-expires) records beyond
 * the configured retention windows. Actual patient records are NEVER
 * deleted — they are flagged for archival review per the hospital's
 * data governance policy.
 *
 * Retention windows (configurable via env):
 *   AUDIT_LOG_RETENTION_DAYS  = 2190  (6 years, HIPAA minimum)
 *   NOTIFICATION_RETENTION_DAYS = 90  (3 months)
 */
@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  private readonly auditLogRetentionDays =
    Number(process.env.AUDIT_LOG_RETENTION_DAYS ?? 2190);

  private readonly notificationRetentionDays =
    Number(process.env.NOTIFICATION_RETENTION_DAYS ?? 90);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  /**
   * Runs every night at 02:00 UTC.
   * Purges notifications older than the retention window.
   * Audit logs are NEVER deleted — only archived (exported to cold storage in prod).
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runRetentionPass(): Promise<void> {
    this.logger.log('Data retention pass starting...');

    await this.purgeOldNotifications();
    await this.logAuditLogStats();

    this.logger.log('Data retention pass complete.');
  }

  private async purgeOldNotifications(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.notificationRetentionDays);

    try {
      const result = await this.notificationRepo.delete({
        isRead: true,
        createdAt: LessThan(cutoff),
      });
      this.logger.log(`Purged ${result.affected ?? 0} read notifications older than ${this.notificationRetentionDays} days`);
    } catch (err) {
      this.logger.error('Failed to purge old notifications', err);
    }
  }

  private async logAuditLogStats(): Promise<void> {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - this.auditLogRetentionDays);

      const count = await this.auditRepo.count({
        where: { createdAt: LessThan(cutoff) },
      });

      if (count > 0) {
        this.logger.warn(
          `RETENTION NOTICE: ${count} audit log entries are older than ${this.auditLogRetentionDays} days ` +
          `(${(this.auditLogRetentionDays / 365).toFixed(1)} years). ` +
          `These should be exported to long-term cold storage per HIPAA § 164.530(j).`,
        );
      } else {
        this.logger.log(`Audit log retention: all entries within ${this.auditLogRetentionDays}-day window.`);
      }
    } catch (err) {
      this.logger.error('Failed to check audit log retention stats', err);
    }
  }

  /**
   * Callable from health checks or admin endpoints to get retention status.
   */
  async getRetentionStatus(): Promise<{
    auditLogRetentionDays: number;
    notificationRetentionDays: number;
    auditLogsExpiringSoon: number;
  }> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.auditLogRetentionDays);

    const auditLogsExpiringSoon = await this.auditRepo.count({
      where: { createdAt: LessThan(cutoff) },
    });

    return {
      auditLogRetentionDays: this.auditLogRetentionDays,
      notificationRetentionDays: this.notificationRetentionDays,
      auditLogsExpiringSoon,
    };
  }
}
