import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbhaProfile } from '../entities/abha-profile.entity';
import { randomInt, randomUUID } from 'crypto';

@Injectable()
export class AbdmService {
  constructor(
    @InjectRepository(AbhaProfile)
    private abhaRepo: Repository<AbhaProfile>
  ) {}

  async getProfiles(tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    const profiles = await this.abhaRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' }
    });

    // Return full UUIDs — no short-ID truncation
    return profiles.map(p => ({
      id: p.id,
      patientId: p.patientId,
      abhaNumber: p.abhaNumber,
      abhaAddress: p.abhaAddress,
      kycStatus: p.kycStatus
    }));
  }

  async generateAbha(tenantId: string, data: any) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!data.aadhaar) throw new BadRequestException('Aadhaar number required for KYC');
    
    // Simulate ABDM API Generation (crypto.randomInt — not Math.random)
    const abhaNumber = `14-${randomInt(1000,9999)}-${randomInt(1000,9999)}-${randomInt(1000,9999)}`;
    const abhaAddress = `${data.patientName.toLowerCase().replace(/\s/g,'')}@sbx`;

    const profile = this.abhaRepo.create({
      tenantId,
      patientId: data.patientId || randomUUID(),
      abhaNumber,
      abhaAddress,
      kycStatus: 'Verified'
    });
    return await this.abhaRepo.save(profile);
  }

  async requestConsent(tenantId: string, data: any) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    // Simulate sending a consent request to the patient's PHR app
    return {
      success: true,
      message: `Consent request sent to HIU linked to ${data.abhaAddress}`,
      consentArtefactId: `CONS-${randomInt(10000, 99999)}`,
      status: 'Awaiting User Approval'
    };
  }
}
