import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Hospital } from '../entities/hospital.entity';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// ─── Mock repository factory ────────────────────────────────────────────────
const mockUserRepo = () => ({
  createQueryBuilder: jest.fn().mockReturnValue({
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  }),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const mockHospitalRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
});

// Mock Redis client (ioredis) — unit tests don't need a real Redis connection
const mockRedisClient = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  setex: jest.fn().mockResolvedValue('OK'),
  keys: jest.fn().mockResolvedValue([]),
};

// ─── Tests ──────────────────────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockUserRepo>;
  let jwtService: ReturnType<typeof mockJwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: getRepositoryToken(Hospital), useFactory: mockHospitalRepo },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: 'REDIS_CLIENT', useValue: mockRedisClient },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  // ── login() ─────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('should return tokens for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('correctPassword', 10);
      const mockUser: Partial<User> = {
        id: 'user-uuid-1',
        email: 'doctor@hms.local',
        passwordHash,
        firstName: 'John',
        lastName: 'Doe',
        role: 'doctor',
        tenantId: 'hospital-uuid-1',
        isActive: true,
        permissions: ['patients:read'],
      };

      userRepo.createQueryBuilder().getOne.mockResolvedValueOnce(mockUser);

      const result = await service.login({
        email: 'doctor@hms.local',
        password: 'correctPassword',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepo.createQueryBuilder().getOne.mockResolvedValueOnce(null);

      await expect(
        service.login({ email: 'notexist@hms.local', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const passwordHash = await bcrypt.hash('correctPassword', 10);
      const mockUser: Partial<User> = {
        id: 'user-uuid-1',
        email: 'doctor@hms.local',
        passwordHash,
        isActive: true,
        role: 'doctor',
        tenantId: 'hospital-uuid-1',
        firstName: 'John',
        lastName: 'Doe',
      };

      userRepo.createQueryBuilder().getOne.mockResolvedValueOnce(mockUser);

      await expect(
        service.login({ email: 'doctor@hms.local', password: 'wrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for deactivated user', async () => {
      const passwordHash = await bcrypt.hash('correctPassword', 10);
      const mockUser: Partial<User> = {
        id: 'user-uuid-1',
        email: 'doctor@hms.local',
        passwordHash,
        isActive: false,  // ← deactivated
        role: 'doctor',
        tenantId: 'hospital-uuid-1',
        firstName: 'John',
        lastName: 'Doe',
      };

      userRepo.createQueryBuilder().getOne.mockResolvedValueOnce(mockUser);

      await expect(
        service.login({ email: 'doctor@hms.local', password: 'correctPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── refresh() ───────────────────────────────────────────────────────────

  describe('refresh()', () => {
    it('should return new tokens for a valid refresh token', async () => {
      jwtService.verify = jest.fn().mockReturnValueOnce({ sub: 'user-uuid-1', tenantId: 'hosp-1' });

      const mockUser: Partial<User> = {
        id: 'user-uuid-1',
        email: 'doctor@hms.local',
        isActive: true,
        role: 'doctor',
        tenantId: 'hosp-1',
        firstName: 'John',
        lastName: 'Doe',
        permissions: ['patients:read'],
      };
      userRepo.findOne.mockResolvedValueOnce(mockUser);

      // Simulate the token being stored in Redis under the white-list key
      const redisKey = `refresh_token:user-uuid-1:mock-jti`;
      mockRedisClient.keys.mockResolvedValueOnce([redisKey]);
      mockRedisClient.get.mockResolvedValueOnce('valid-refresh-token');

      const result = await service.refresh('valid-refresh-token');
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtService.verify = jest.fn().mockImplementation(() => { throw new Error('expired'); });

      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
