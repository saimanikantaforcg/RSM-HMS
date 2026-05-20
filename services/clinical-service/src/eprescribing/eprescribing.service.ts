import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Prescription, PrescriptionStatus, PRESCRIPTION_TRANSITIONS,
} from '../entities/prescription.entity';
import { PrescriptionItem } from '../entities/prescription-item.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { AddPrescriptionItemDto } from './dto/add-prescription-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class EprescribingService {
  constructor(
    @InjectRepository(Prescription)
    private readonly rxRepo: Repository<Prescription>,
    @InjectRepository(PrescriptionItem)
    private readonly itemRepo: Repository<PrescriptionItem>,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAll(tenantId: string, query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.rxRepo.findAndCount({
      where: { tenantId },
      order: { prescribedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
    });
    return createPaginatedResponse(data, total, page, limit);
  }

  async findByEncounter(encounterId: string, tenantId: string) {
    return this.rxRepo.find({
      where: { encounterId, tenantId },
      order: { prescribedAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const rx = await this.rxRepo.findOne({ where: { id, tenantId } });
    if (!rx) throw new NotFoundException(`Prescription ${id} not found`);
    return rx;
  }

  async create(
    dto: CreatePrescriptionDto,
    tenantId: string,
    actorId: string,
    actorName: string,
  ) {
    const rx = this.rxRepo.create({
      tenantId,
      encounterId: dto.encounterId,
      patientId: dto.patientId,
      patientName: dto.patientName,
      prescribedById: actorId,
      prescribedByName: actorName,
      notes: dto.notes,
      status: 'Draft',
    });
    const saved = await this.rxRepo.save(rx);

    await this.auditLog.log({
      tenantId,
      userId: actorId,
      action: 'CREATE',
      entityName: 'Prescription',
      entityId: saved.id,
      changes: { encounterId: dto.encounterId, patientId: dto.patientId },
    });

    return saved;
  }

  async addItem(prescriptionId: string, dto: AddPrescriptionItemDto, tenantId: string) {
    const rx = await this.rxRepo.findOne({ where: { id: prescriptionId, tenantId } });
    if (!rx) throw new NotFoundException(`Prescription ${prescriptionId} not found`);

    if (rx.status !== 'Draft') {
      throw new BadRequestException(
        `Cannot add items to a prescription in '${rx.status}' status. Only Draft prescriptions accept new items.`,
      );
    }

    const item = this.itemRepo.create({
      tenantId,
      prescriptionId,
      drugName: dto.drugName,
      drugCatalogId: dto.drugCatalogId ?? null,
      dosage: dto.dosage,
      frequency: dto.frequency,
      duration: dto.duration,
      route: dto.route,
      quantityOrdered: dto.quantityOrdered ?? 1,
      instructions: dto.instructions,
      status: 'Pending',
    });
    return this.itemRepo.save(item);
  }

  async transition(id: string, tenantId: string, newStatus: PrescriptionStatus) {
    const rx = await this.rxRepo.findOne({ where: { id, tenantId } });
    if (!rx) throw new NotFoundException(`Prescription ${id} not found`);

    const allowed = PRESCRIPTION_TRANSITIONS[rx.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition prescription from '${rx.status}' to '${newStatus}'. ` +
        `Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`,
      );
    }

    const oldStatus = rx.status;
    rx.status = newStatus;
    const saved = await this.rxRepo.save(rx);

    await this.auditLog.log({
      tenantId,
      action: 'UPDATE',
      entityName: 'Prescription',
      entityId: id,
      changes: { statusFrom: oldStatus, statusTo: newStatus },
    });

    return saved;
  }
}

