import {
  Injectable, UnauthorizedException, NotFoundException, ConflictException, Inject
} from '@nestjs/common';
import Redis from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { Repository, DeepPartial } from 'typeorm';
import { randomUUID } from 'crypto';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { User, UserRole } from '../entities/user.entity';
import { Hospital } from '../entities/hospital.entity';
import * as bcrypt from 'bcrypt';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Hospital)
    private readonly hospitalRepo: Repository<Hospital>,
    private readonly jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) { }

  private readonly logger = new Logger(AuthService.name);

  // ─── Build JWT Payload ────────────────────────────────────────────────────
  private async buildTokens(user: User, deviceInfo?: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      permissions: user.permissions ?? this.defaultPermissions(user.role),
      name: `${user.firstName} ${user.lastName}`,
      deviceId: deviceInfo,
    };

    // Access Token (Short-lived: 15 min)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshTokenSecret) {
      throw new Error('JWT_REFRESH_SECRET is not set. Clinical service cannot sign refresh tokens.');
    }

    // Refresh Token (Long-lived: 7 days)
    const refreshToken = this.jwtService.sign(
      { sub: user.id, tenantId: user.tenantId, jti: randomUUID() },
      { expiresIn: '7d', secret: refreshTokenSecret }
    );

    // Store refresh token in Redis (White-listing)
    // Key format: refresh_token:userId:deviceId
    const redisKey = `refresh_token:${user.id}:${deviceInfo || 'default'}`;
    await this.redis.set(redisKey, refreshToken, 'EX', 7 * 24 * 60 * 60);

    return { accessToken, refreshToken, user: payload };
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    // Find user with passwordHash (normally excluded from selects)
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')   // entity property name — needed because select:false
      .where('u.email = :email', { email: dto.email.toLowerCase().trim() })
      .getOne();

    if (!user) {
      this.logger.warn(`User not found: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      this.logger.warn(`User inactive: ${dto.email}`);
      throw new UnauthorizedException('Account is deactivated');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - new Date().getTime()) / 60000);
      this.logger.warn(`Login attempt for locked account: ${dto.email}`);
      throw new UnauthorizedException(`Account is locked. Try again in ${waitMinutes} minutes.`);
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    
    if (!valid) {
      // Increment failed attempts
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60000); // 15 minute lock
        this.logger.warn(`Account LOCKED for ${dto.email} after 5 attempts`);
      }
      await this.userRepo.save(user);

      this.logger.warn(`Invalid password for ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }

    // Phase 1: Tracking login patterns
    user.lastLoginAt = new Date();
    // Note: IP and Device should be passed from Controller
    await this.userRepo.save(user);

    this.logger.log(`Login successful: ${dto.email} (Tenant: ${user.tenantId})`);
    return this.buildTokens(user);
  }

  /**
   * Enhanced Login with device/IP tracking
   */
  async loginWithMeta(dto: LoginDto, ip: string, device: string) {
    const tokens = await this.login(dto);
    
    // Update tracking fields
    const user = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase().trim() } });
    if (!user) throw new UnauthorizedException('User not found after login');
    
    user.lastLoginIp = ip;
    user.lastDeviceInfo = device;
    await this.userRepo.save(user);
    
    // We rebuild tokens with device info for the payload
    return this.buildTokens(user, device);
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────
  async refresh(refreshToken: string) {
    try {
      const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
      if (!refreshTokenSecret) throw new Error('JWT_REFRESH_SECRET is not set');
      
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshTokenSecret,
      });

      // Verify token exists in Redis (White-list check)
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw new UnauthorizedException('User not found');

      const redisKeyPattern = `refresh_token:${user.id}:*`;
      const keys = await this.redis.keys(redisKeyPattern);
      
      let matchedKey: string | null = null;
      for (const key of keys) {
        const storedToken = await this.redis.get(key);
        if (storedToken === refreshToken) {
          matchedKey = key;
          break;
        }
      }

      if (!matchedKey) {
        throw new UnauthorizedException('Session expired or invalidated');
      }

      // Refresh token rotation: invalidate the consumed token before issuing new ones
      await this.redis.del(matchedKey);

      return this.buildTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Invalidate all sessions for a user (useful for security resets)
   */
  async logout(userId: string, deviceId?: string) {
    if (deviceId) {
      const redisKey = `refresh_token:${userId}:${deviceId}`;
      await this.redis.del(redisKey);
    } else {
      const redisKeyPattern = `refresh_token:${userId}:*`;
      const keys = await this.redis.keys(redisKeyPattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  // ─── Seed / Demo Login (dev only) ─────────────────────────────────────────
  async seedDemoUser(): Promise<{ message: string; credentials: any[] }> {
    // Check if demo hospital exists
    let hospital = await this.hospitalRepo.findOne({ where: { name: 'General Hospital' } });
    if (!hospital) {
      hospital = this.hospitalRepo.create({ name: 'General Hospital', contactEmail: 'admin@hms.local' });
      await this.hospitalRepo.save(hospital);
    }

    const roles: { role: UserRole; email: string; first: string; last: string; perms: string[] }[] = [
      { role: 'hospital_admin', email: 'admin@hms.local', first: 'Dr. Admin', last: 'Smith', perms: ['*:*'] },
      { role: 'doctor', email: 'doctor@hms.local', first: 'Dr. Sarah', last: 'Clinical', perms: ['clinical', 'patient_admin', 'diagnostics'] },
      { role: 'nurse', email: 'nurse@hms.local', first: 'Nurse', last: 'Joy', perms: ['clinical', 'patient_admin'] },
      { role: 'receptionist', email: 'reception@hms.local', first: 'Alice', last: 'Reception', perms: ['patient_admin'] },
      { role: 'billing_officer', email: 'billing@hms.local', first: 'Bob', last: 'Finance', perms: ['billing'] },
      { role: 'pharmacist', email: 'pharmacy@hms.local', first: 'Phil', last: 'Dispenser', perms: ['diagnostics', 'ops'] },
      { role: 'lab_technician', email: 'lab@hms.local', first: 'Larry', last: 'Lab', perms: ['diagnostics'] },
      { role: 'hr', email: 'hr@hms.local', first: 'Helen', last: 'Resources', perms: ['ops'] },
    ];

    const results = [];

    for (const r of roles) {
      // Clean start for each role
      await this.userRepo.delete({ email: r.email });
      
      const user = this.userRepo.create({
        email: r.email,
        passwordHash: 'admin123', // Consistently using admin123 for demo
        firstName: r.first,
        lastName: r.last,
        role: r.role,
        tenantId: hospital.id,
        permissions: r.perms,
        isActive: true,
      });
      await this.userRepo.save(user);
      results.push({ role: r.role, email: r.email, password: 'admin123' });
    }

    return { 
      message: 'Demo environment seeded with multi-role accounts.', 
      credentials: results 
    };
  }


  // ─── Default permissions per role ─────────────────────────────────────────
  private defaultPermissions(role: string): string[] {
    const permMap: Record<string, string[]> = {
      super_admin: ['*:*'],
      hospital_admin: ['*:*'],
      doctor: ['patients:read', 'encounters:write', 'lab_orders:write', 'prescriptions:write', 'clinical', 'patient_admin', 'diagnostics'],
      nurse: ['patients:read', 'vitals:write', 'encounters:update', 'clinical', 'patient_admin'],
      receptionist: ['patients:write', 'appointments:write', 'patient_admin'],
      billing_officer: ['invoices:write', 'payments:write', 'claims:write', 'patients:read', 'billing'],
      pharmacist: ['prescriptions:read', 'inventory:write', 'diagnostics', 'ops'],
      lab_technician: ['lab_orders:read', 'results:write', 'diagnostics'],
      hr: ['staff:read', 'ops'],
    };
    return permMap[role] ?? ['patients:read'];
  }
}
