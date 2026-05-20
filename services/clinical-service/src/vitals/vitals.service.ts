import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VitalSign } from '../entities/vital-sign.entity';

@Injectable()
export class VitalsService {
  constructor(
    @InjectRepository(VitalSign)
    private readonly vitalsRepo: Repository<VitalSign>,
  ) {}

  async getVitals(tenantId: string, patientId: string) {
    const results = await this.vitalsRepo.find({
      where: { tenantId, patientId },
      order: { recordedAt: 'DESC' },
      take: 20,
    });

    return results.map(v => ({
      id: v.id,
      patientId: v.patientId,
      bp: v.bp,
      hr: v.hr,
      temp: v.temp,
      o2: v.spo2, // Mapping field name to match frontend expectation
      rr: v.rr,
      weight: v.weight,
      date: v.recordedAt.toISOString().split('T')[0],
      time: v.recordedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }

  async recordVitals(tenantId: string, data: any) {
    const entry = this.vitalsRepo.create({
      tenantId,
      patientId: data.patientId,
      bp: data.bp,
      hr: data.hr,
      spo2: data.spo2 || data.o2, // Handle both naming conventions
      temp: data.temp,
      rr: data.rr,
      weight: data.weight,
      recordedBy: data.author || 'System',
    });

    const saved = await this.vitalsRepo.save(entry);
    return {
      ...saved,
      date: saved.recordedAt.toISOString().split('T')[0],
    };
  }
}
