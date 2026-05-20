import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Encounter } from '../entities/encounter.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class TelemedService {
  constructor(
    @InjectRepository(Encounter)
    private readonly encounterRepo: Repository<Encounter>,
  ) {}

  async getSessions(tenantId: string): Promise<Encounter[]> {
    return this.encounterRepo.find({
      where: { tenantId, type: 'Telemedicine' },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async joinSession(data: any, tenantId: string) {
    // Find or create a Telemedicine encounter for this session
    let encounter: Encounter | null = null;
    if (data.sessionId) {
      encounter = await this.encounterRepo.findOne({
        where: { id: data.sessionId, tenantId, type: 'Telemedicine' },
      });
    }

    if (!encounter) {
      encounter = this.encounterRepo.create({
        tenantId,
        patientId: data.patientId ?? `anon-${randomUUID()}`,
        patientName: data.patientName ?? 'Unknown',
        type: 'Telemedicine',
        status: 'InProgress',
        practitionerId: data.providerId ?? null,
        practitionerName: data.providerName ?? null,
      });
      await this.encounterRepo.save(encounter);
    } else {
      encounter.status = 'InProgress';
      await this.encounterRepo.save(encounter);
    }

    // Generate a cryptographically random room token (no Math.random)
    const token = `rtc-${randomUUID()}`;
    return {
      success: true,
      token,
      roomId: encounter.id,
      message: 'Joined secure WebRTC room',
    };
  }
}
