import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN';

/**
 * AuditLog
 * ---------
 * HIPAA/GDPR-compliant immutable audit trail.
 * Records EVERY mutation (create/update/delete) against patient & clinical data.
 * Once written, records are NEVER modified (no @UpdateDateColumn).
 */
@Entity('audit_logs')
@Index(['tenantId', 'entityName', 'entityId'])
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Hospital/tenant this event belongs to */
  @Column({ nullable: true })
  @Index()
  tenantId: string;

  /** User who performed the action (null for system actions) */
  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ nullable: true })
  userRole: string;

  /** Action type */
  @Column({ type: 'varchar' })
  action: AuditAction;

  /** Name of the entity affected (e.g. "Patient", "Encounter", "Invoice") */
  @Column()
  entityName: string;

  /** Primary key of the affected record */
  @Column({ nullable: true })
  entityId: string;

  /** JSON diff of changes (previous → new values) */
  @Column({ type: 'text', nullable: true })
  changes?: string;

  /** IP address of the requester */
  @Column({ nullable: true })
  ipAddress?: string;

  /** User-Agent string */
  @Column({ nullable: true })
  userAgent?: string;

  /** Additional context (e.g. failure reason) */
  @Column({ nullable: true })
  notes?: string;

  /**
   * Hash chain for tamper detection.
   * SHA-256( prevHash + id + tenantId + userId + action + entityId + createdAt )
   * Verifying that each record's entryHash matches re-computing the hash
   * from its fields proves no field was altered after insert.
   * prevHash of the first record is '0000...000' (64 zeros).
   */
  @Column({ name: 'prev_hash', type: 'varchar', length: 64, nullable: true })
  prevHash?: string;

  @Column({ name: 'entry_hash', type: 'varchar', length: 64, nullable: true })
  entryHash?: string;

  /** Immutable timestamp — NEVER update after insert */
  @CreateDateColumn()
  createdAt: Date;
}
