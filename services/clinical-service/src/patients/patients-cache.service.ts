import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { Patient } from '../entities/patient.entity';

/**
 * PatientsCacheService
 * -------------------
 * Provides a caching layer for patient data using Redis.
 * This is crucial for high-performance clinical applications.
 */
@Injectable()
export class PatientsCacheService {
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  private getCacheKey(tenantId: string, patientId: string): string {
    return `hms:cache:patient:${tenantId}:${patientId}`;
  }

  async getPatient(tenantId: string, patientId: string): Promise<Patient | null> {
    const data = await this.redis.get(this.getCacheKey(tenantId, patientId));
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async setPatient(tenantId: string, patient: Patient): Promise<void> {
    const key = this.getCacheKey(tenantId, patient.id);
    await this.redis.set(key, JSON.stringify(patient), 'EX', this.CACHE_TTL);
  }

  async invalidatePatient(tenantId: string, patientId: string): Promise<void> {
    await this.redis.del(this.getCacheKey(tenantId, patientId));
  }
}
