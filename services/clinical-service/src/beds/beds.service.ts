import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Bed } from '../entities/bed.entity';
import { Ward } from '../entities/ward.entity';

@Injectable()
export class BedsService {
  constructor(
    @InjectRepository(Bed)
    private readonly bedRepo: Repository<Bed>,
    @InjectRepository(Ward)
    private readonly wardRepo: Repository<Ward>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getBeds(tenantId: string) {
    const beds = await this.bedRepo.find({
      where: { tenantId },
      relations: ['ward'],
      order: { bedNumber: 'ASC' },
    });
    return beds.map(b => ({
      id: b.id,
      bedNumber: b.bedNumber,
      ward: b.ward?.name ?? 'Unknown',
      wardType: b.ward?.type ?? 'General',
      status: b.status,
      currentPatientId: b.currentPatientId,
    }));
  }

  async updateBedState(data: any, tenantId: string) {
    const bed = await this.bedRepo.findOne({ where: { id: data.bedId, tenantId } });
    if (!bed) throw new NotFoundException(`Bed ${data.bedId} not found`);

    if (data.status) bed.status = data.status;
    if (data.currentPatientId !== undefined) bed.currentPatientId = data.currentPatientId ?? null;

    const saved = await this.bedRepo.save(bed);
    // Push real-time update to all SSE subscribers for this tenant
    this.eventEmitter.emit(`bed.update.${tenantId}`, {
      id: saved.id,
      bedNumber: saved.bedNumber,
      status: saved.status,
      currentPatientId: saved.currentPatientId,
    });
    return { success: true, updatedBed: saved };
  }
}
