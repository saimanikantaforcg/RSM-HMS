import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientConsent, ConsentType } from '../entities/patient-consent.entity';
import { RecordConsentDto } from './dto/record-consent.dto';

@Injectable()
export class ConsentService {
  constructor(
    @InjectRepository(PatientConsent)
    private readonly consentRepo: Repository<PatientConsent>,
  ) {}

  /**
   * Returns full consent history for a patient (newest first).
   * Current status per consent type = the most recent row.
   */
  async getHistory(tenantId: string, patientId: string) {
    return this.consentRepo.find({
      where: { tenantId, patientId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Returns current effective consent status per type (latest row per type).
   */
  async getCurrent(tenantId: string, patientId: string) {
    const all = await this.getHistory(tenantId, patientId);
    const seen = new Set<ConsentType>();
    return all.filter(c => {
      if (seen.has(c.consentType)) return false;
      seen.add(c.consentType);
      return true;
    });
  }

  /**
   * Inserts a new immutable consent record — existing rows are NEVER modified.
   * This preserves the full audit trail required by GDPR Art. 7 and HIPAA § 164.508.
   */
  async record(
    tenantId: string,
    patientId: string,
    dto: RecordConsentDto,
    recordedBy?: string,
    ipAddress?: string,
  ) {
    const entry = this.consentRepo.create({
      tenantId,
      patientId,
      consentType: dto.consentType,
      status: dto.status,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      consentText: dto.consentText ?? null,
      documentVersion: dto.documentVersion ?? null,
      recordedBy: recordedBy ?? null,
      ipAddress: ipAddress ?? null,
    });
    return this.consentRepo.save(entry);
  }

  /** Check whether a patient has active (non-expired, non-withdrawn) consent for a purpose */
  async hasActiveConsent(tenantId: string, patientId: string, type: ConsentType): Promise<boolean> {
    const current = await this.getCurrent(tenantId, patientId);
    const record = current.find(c => c.consentType === type);
    if (!record || record.status === 'withdrawn') return false;
    if (record.expiresAt && record.expiresAt < new Date()) return false;
    return true;
  }
}
