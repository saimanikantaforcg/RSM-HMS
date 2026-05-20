import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Encounter, EncounterStatus, ENCOUNTER_TRANSITIONS,
} from '../entities/encounter.entity';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class EncountersService {
  constructor(
    @InjectRepository(Encounter)
    private readonly encounterRepo: Repository<Encounter>,
  ) { }

  async findAll(tenantId: string, query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.encounterRepo.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
    });
    return createPaginatedResponse(data, total, page, limit);
  }

  async findByPatient(patientId: string, tenantId: string) {
    return this.encounterRepo.find({
      where: { patientId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const enc = await this.encounterRepo.findOne({ where: { id, tenantId } });
    if (!enc) throw new NotFoundException(`Encounter ${id} not found`);
    return enc;
  }

  async create(dto: CreateEncounterDto, tenantId: string, actorId: string, actorName: string) {
    const enc = this.encounterRepo.create({
      ...dto,
      tenantId,
      type: dto.type ?? 'OPD',
      status: 'Planned',
      practitionerId: dto.practitionerId ?? actorId,
      practitionerName: dto.practitionerName ?? actorName,
      admissionDate: dto.admissionDate ?? new Date().toISOString().split('T')[0],
    });
    return this.encounterRepo.save(enc);
  }

  async updateStatus(id: string, tenantId: string, newStatus: EncounterStatus) {
    const enc = await this.encounterRepo.findOne({ where: { id, tenantId } });
    if (!enc) throw new NotFoundException(`Encounter ${id} not found`);

    const allowed = ENCOUNTER_TRANSITIONS[enc.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition encounter from '${enc.status}' to '${newStatus}'. ` +
        `Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`,
      );
    }

    enc.status = newStatus;
    if (newStatus === 'Discharged') {
      enc.dischargeDate = new Date().toISOString().split('T')[0];
    }
    return this.encounterRepo.save(enc);
  }
}
