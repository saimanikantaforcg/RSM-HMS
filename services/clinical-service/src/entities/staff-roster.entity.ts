import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn
} from 'typeorm';
import { User } from './user.entity';

export type ShiftType = 'Morning' | 'Afternoon' | 'Night' | 'On-Call' | 'Emergency';

@Entity('staff_rosters')
@Index(['tenantId', 'userId', 'date'])
export class StaffRoster {
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

  @Column({ name: 'date', type: 'date' })
  date: string;

  @Column({ name: 'shift_type', type: 'varchar' })
  shiftType: ShiftType;

  @Column({ type: 'varchar', nullable: true })
  department: string; // Cardiology, ER, ICU

  @Column({ default: false, name: 'is_on_call' })
  isOnCall: boolean;

  @Column({ type: 'varchar', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
