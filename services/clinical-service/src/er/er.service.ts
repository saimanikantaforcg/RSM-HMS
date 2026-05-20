import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ErCase } from './er-case.entity';

@Injectable()
export class ErService {
  constructor(
    @InjectRepository(ErCase)
    private readonly erRepo: Repository<ErCase>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getCases(tenantId: string): Promise<ErCase[]> {
    return this.erRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async triageCase(data: any, tenantId: string): Promise<ErCase> {
    const erCase = this.erRepo.create({
      tenantId,
      patient: data.patient ?? 'Unknown',
      level: data.level,
      condition: data.condition ?? null,
      status: 'Triaged',
      patientId: data.patientId ?? null,
      assignedDoctorId: data.assignedDoctorId ?? null,
    });
    const saved = await this.erRepo.save(erCase);
    // Broadcast to all SSE subscribers for this tenant
    this.eventEmitter.emit(`er.update.${tenantId}`, saved);
    return saved;
  }
}
