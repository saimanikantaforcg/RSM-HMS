import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert
} from 'typeorm';
import { Hospital } from './hospital.entity';
import * as bcrypt from 'bcrypt';

export type UserRole = 'super_admin' | 'hospital_admin' | 'doctor' | 'nurse' | 'receptionist' | 'billing_officer' | 'pharmacist' | 'lab_technician' | 'hr';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** tenant_id — isolates users per hospital */
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Hospital, hospital => hospital.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id', referencedColumnName: 'id' })
  hospital: Hospital;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', default: 'doctor' })
  role: UserRole;

  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];

  @Column({ type: 'varchar', nullable: true })
  department: string;

  /** Physician-specific fields (null for non-doctor roles) */
  @Column({ type: 'varchar', nullable: true })
  specialty: string;

  @Column({ type: 'varchar', name: 'license_number', nullable: true })
  licenseNumber: string;

  @Column({ type: 'varchar', name: 'license_expiry', nullable: true })
  licenseExpiry: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', name: 'last_login_ip', nullable: true })
  lastLoginIp: string;

  @Column({ type: 'varchar', name: 'last_device_info', nullable: true })
  lastDeviceInfo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /** Hash password before inserting */
  @BeforeInsert()
  async hashPassword() {
    if (this.passwordHash) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
  }

  async comparePassword(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.passwordHash);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
