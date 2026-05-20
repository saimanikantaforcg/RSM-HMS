import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabOrder, LabOrderStatus, LAB_ORDER_TRANSITIONS } from '../entities/lab-order.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateLabOrderDto, EnterResultDto } from './dto/lab-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class LisService {
  constructor(
    @InjectRepository(LabOrder)
    private readonly labRepo: Repository<LabOrder>,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAll(tenantId: string, query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.labRepo.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
    });
    return createPaginatedResponse(data, total, page, limit);
  }

  async findByEncounter(encounterId: string, tenantId: string) {
    return this.labRepo.find({
      where: { encounterId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const order = await this.labRepo.findOne({ where: { id, tenantId } });
    if (!order) throw new NotFoundException(`Lab order ${id} not found`);
    return order;
  }

  async create(
    dto: CreateLabOrderDto,
    tenantId: string,
    actorId: string,
    actorName: string,
  ) {
    // MRN must come from the validated patient record — never auto-generate
    const order = this.labRepo.create({
      tenantId,
      encounterId: dto.encounterId,
      patientId: dto.patientId,
      patientName: dto.patientName,
      mrn: dto.mrn,
      testProfile: dto.test,
      testCatalogId: dto.testCatalogId ?? null,
      priority: (dto.priority ?? 'Routine') as any,
      status: 'Ordered',
      orderedById: actorId,
      orderedByName: actorName,
    });
    const saved = (await this.labRepo.save(order)) as LabOrder;

    await this.auditLog.log({
      tenantId,
      userId: actorId,
      action: 'CREATE',
      entityName: 'LabOrder',
      entityId: saved.id,
      changes: { encounterId: dto.encounterId, patientId: dto.patientId, test: dto.test },
    });

    return saved;
  }

  async markSampleCollected(id: string, tenantId: string, actorId: string) {
    return this.transition(id, tenantId, 'SampleCollected', actorId, {
      sampleCollectedAt: new Date(),
      sampleCollectedBy: actorId,
    });
  }

  async enterResult(id: string, tenantId: string, dto: EnterResultDto, actorId: string) {
    const order = await this.findOne(id, tenantId);

    const allowed = LAB_ORDER_TRANSITIONS[order.status];
    if (!allowed.includes('ResultEntered')) {
      throw new BadRequestException(
        `Cannot enter result for lab order in '${order.status}' status. ` +
        `Must be in SampleCollected or InProgress state.`,
      );
    }

    order.resultValue = dto.resultValue ?? null;
    order.resultUnit = dto.resultUnit ?? null;
    order.resultInterpretation = dto.resultInterpretation ?? null;
    order.resultedBy = actorId;
    order.resultedAt = new Date();
    order.status = 'ResultEntered';

    const saved = await this.labRepo.save(order);

    await this.auditLog.log({
      tenantId,
      userId: actorId,
      action: 'UPDATE',
      entityName: 'LabOrder',
      entityId: id,
      changes: { status: 'ResultEntered', resultInterpretation: dto.resultInterpretation },
    });

    return saved;
  }

  async verify(id: string, tenantId: string, actorId: string) {
    return this.transition(id, tenantId, 'Verified', actorId, {
      verifiedById: actorId,
      verifiedAt: new Date(),
    });
  }

  async transition(
    id: string,
    tenantId: string,
    newStatus: LabOrderStatus,
    actorId: string,
    extraFields: Partial<LabOrder> = {},
  ) {
    const order = await this.findOne(id, tenantId);
    const allowed = LAB_ORDER_TRANSITIONS[order.status];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition lab order from '${order.status}' to '${newStatus}'. ` +
        `Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`,
      );
    }

    const oldStatus = order.status;
    Object.assign(order, extraFields);
    order.status = newStatus;
    const saved = await this.labRepo.save(order);

    await this.auditLog.log({
      tenantId,
      userId: actorId,
      action: 'UPDATE',
      entityName: 'LabOrder',
      entityId: id,
      changes: { statusFrom: oldStatus, statusTo: newStatus },
    });

    return saved;
  }
}

