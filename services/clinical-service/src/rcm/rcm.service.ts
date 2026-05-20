import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RcmEntry } from '../entities/rcm-entry.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class RcmService {
  constructor(
    @InjectRepository(RcmEntry)
    private rcmRepo: Repository<RcmEntry>
  ) {}

  async getPipeline(tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    const entries = await this.rcmRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    
    // Return full UUID id for mutation compatibility
    return entries.map(e => ({
      id: e.id,
      stage: e.stage,
      patient: e.patientName,
      value: `$${Number(e.value).toFixed(2)}`,
      status: e.status,
      date: e.createdAt.toISOString().split('T')[0]
    }));
  }

  async updatePipeline(tenantId: string, data: any) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    const val = parseFloat(data.value || '0');
    const entry = this.rcmRepo.create({
      tenantId,
      patientId: randomUUID(),
      patientName: data.patient,
      stage: data.stage,
      value: val,
      status: 'In Progress'
    });

    const saved = await this.rcmRepo.save(entry);
    return saved;
  }
}
