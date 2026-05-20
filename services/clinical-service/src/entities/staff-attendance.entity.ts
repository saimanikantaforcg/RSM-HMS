import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity('staff_attendance')
@Index(['tenantId', 'userId'])
export class StaffAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'clock_in', type: 'datetime' })
  clockIn: Date;

  @Column({ name: 'clock_out', type: 'datetime', nullable: true })
  clockOut: Date;

  @Column({ type: 'varchar', nullable: true })
  location: string; // OPD, ER, Main Entrance

  @Column({ type: 'varchar', default: 'Present' })
  status: 'Present' | 'Late' | 'Absent';

  @Column({ type: 'varchar', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
