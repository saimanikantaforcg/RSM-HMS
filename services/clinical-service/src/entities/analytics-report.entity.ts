import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export type ReportType = 'Financial' | 'Clinical Outcomes' | 'Operational Efficiency';

@Entity('analytics_reports')
@Index(['tenantId', 'createdAt'])
export class AnalyticsReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: ReportType;

  @Column()
  author: string;

  @Column({ type: 'simple-json', nullable: true, name: 'report_data' })
  reportData: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
