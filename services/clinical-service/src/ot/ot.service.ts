import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurgeryBlock } from '../entities/surgery-block.entity';

@Injectable()
export class OtService {
  constructor(
    @InjectRepository(SurgeryBlock)
    private otRepo: Repository<SurgeryBlock>
  ) {}

  async getSurgeries(tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    const surgeries = await this.otRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    
    // Return full UUIDs — no short-ID truncation
    return surgeries.map(s => ({
      id: s.id,
      patient: s.patientName,
      procedure: s.procedureName,
      time: s.time,
      room: s.room,
      surgeon: s.surgeon,
      status: s.status,
      clearance: s.clearance
    }));
  }

  async scheduleSurgery(tenantId: string, data: any) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    const block = this.otRepo.create({
      tenantId,
      patientName: data.patient,
      procedureName: data.procedure,
      time: data.time || '10:00 AM',
      room: data.room || 'OR-02',
      surgeon: data.surgeon || 'Unassigned',
      status: 'Scheduled'
    });
    return await this.otRepo.save(block);
  }
}
