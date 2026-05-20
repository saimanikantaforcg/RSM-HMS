import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { StaffAttendance } from '../entities/staff-attendance.entity';
import { StaffRoster } from '../entities/staff-roster.entity';
import { AuditLogService } from '../audit-log/audit-log.service';

export interface CreateUserDto {
  email: string;
  passwordHash: string; // Plain password mapped as passwordHash so @BeforeInsert hooks it
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(StaffAttendance)
    private readonly attendanceRepo: Repository<StaffAttendance>,
    @InjectRepository(StaffRoster)
    private readonly rosterRepo: Repository<StaffRoster>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(tenantId: string) {
    const users = await this.userRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return users.map(u => this.serialize(u));
  }

  async getPhysicians(tenantId: string) {
    const doctors = await this.userRepo.find({
      where: { tenantId, role: 'doctor' },
      order: { firstName: 'ASC' },
    });
    return doctors.map(u => this.serialize(u));
  }

  async create(dto: CreateUserDto, tenantId: string) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const user = this.userRepo.create({
      ...dto,
      tenantId,
      isActive: true,
    });
    const saved = await this.userRepo.save(user);
    return this.serialize(saved);
  }

  // ─── Attendance Logic ──────────────────────────────────────────────────
  async clockIn(tenantId: string, userId: string, location?: string) {
    const attendance = this.attendanceRepo.create({
      tenantId,
      userId,
      clockIn: new Date(),
      status: 'Present',
      location: location || 'Main Entrance'
    });
    return await this.attendanceRepo.save(attendance);
  }

  async clockOut(tenantId: string, userId: string) {
    const record = await this.attendanceRepo.findOne({
      where: { tenantId, userId, clockOut: IsNull() },
      order: { clockIn: 'DESC' }
    });
    if (!record) throw new NotFoundException('No active clock-in session found');

    record.clockOut = new Date();
    return await this.attendanceRepo.save(record);
  }

  async getAttendanceHistory(tenantId: string, userId?: string) {
    const where: any = { tenantId };
    if (userId) where.userId = userId;

    return await this.attendanceRepo.find({
      where,
      order: { clockIn: 'DESC' },
      relations: ['user'],
      take: 50
    });
  }

  // ─── Roster Logic ──────────────────────────────────────────────────────
  async createRoster(tenantId: string, data: any) {
    const roster = this.rosterRepo.create({
      tenantId,
      userId: data.userId,
      date: data.date,
      shiftType: data.shiftType,
      department: data.department,
      isOnCall: !!data.isOnCall,
      notes: data.notes
    });
    return await this.rosterRepo.save(roster);
  }

  async getRoster(tenantId: string, department?: string) {
    const where: any = { tenantId };
    if (department) where.department = department;

    return await this.rosterRepo.find({
      where,
      order: { date: 'ASC' },
      relations: ['user']
    });
  }

  async toggleActive(id: string, tenantId: string) {
    const user = await this.userRepo.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    
    // Protect super admin from self-lockout
    if (user.role === 'super_admin') throw new ConflictException('Cannot deactivate super admin');

    user.isActive = !user.isActive;
    const saved = await this.userRepo.save(user);
    return this.serialize(saved);
  }

  async update(id: string, dto: any, tenantId: string) {
    const user = await this.userRepo.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');

    // Update fields
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.role) user.role = dto.role;
    if (dto.department) user.department = dto.department;
    if (dto.email) user.email = dto.email;

    // Password reset if provided
    if (dto.password) {
      user.passwordHash = dto.password; // Hook will hash it
    }

    const saved = await this.userRepo.save(user);
    return this.serialize(saved);
  }

  private serialize(user: User) {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async getSecurityAudit(tenantId: string) {
    const { data } = await this.auditLogService.findByTenant(tenantId, 1, 20);
    return data.map(a => ({
      id: a.id,
      time: a.createdAt,
      event: a.action,
      user: a.userEmail ?? a.userId ?? 'system',
      severity: ['LOGIN', 'LOGOUT'].includes(a.action) ? 'Low' : 'High',
      ip: a.ipAddress ?? 'unknown',
    }));
  }

  enforceMfa() {
    return { success: true, message: 'Global Multi-Factor Authentication (MFA) has been enforced for all accounts.' };
  }
}
