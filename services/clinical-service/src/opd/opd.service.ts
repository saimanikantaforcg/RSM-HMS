import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Encounter } from '../entities/encounter.entity';
import { Appointment } from '../entities/appointment.entity';
import { Patient } from '../entities/patient.entity';
import { OpdQueue, OpdQueueStatus, OPD_QUEUE_TRANSITIONS } from '../entities/opd-queue.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { RegisterWalkInDto } from './dto/register-walk-in.dto';

@Injectable()
export class OpdService {
  constructor(
    @InjectRepository(Encounter)
    private readonly encounterRepo: Repository<Encounter>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(OpdQueue)
    private readonly queueRepo: Repository<OpdQueue>,
    private readonly dataSource: DataSource,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Live OPD queue — returns OpdQueue entries not yet completed */
  async getQueue(
    tenantId: string,
    filters: { departmentId?: string; doctorId?: string } = {},
  ) {
    const where: any = {
      tenantId,
      status: ['Waiting', 'Called', 'InConsultation'] as any,
    };
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.doctorId) where.assignedDoctorId = filters.doctorId;

    const entries = await this.queueRepo.find({
      where,
      order: { tokenNumber: 'ASC', createdAt: 'ASC' },
    });

    return entries.map((e) => ({
      id: e.id,
      token: e.tokenNumber,
      name: e.patientName,
      mrn: e.mrn,
      department: e.departmentName,
      doctor: e.assignedDoctorName,
      status: e.status,
      chiefComplaint: e.chiefComplaint,
      waitMinutes: e.calledAt
        ? null
        : Math.floor((Date.now() - new Date(e.createdAt).getTime()) / 60000),
    }));
  }

  /**
   * Walk-in registration — creates Patient + Encounter + OpdQueue entry atomically.
   * MRN is NEVER auto-generated here; it must be provided in the DTO.
   */
  async registerWalkIn(
    tenantId: string,
    data: RegisterWalkInDto,
    actorId: string,
    actorName: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Create patient record
      const [firstName, ...rest] = (data.name ?? '').split(' ');
      const lastName = rest.join(' ') || 'Unknown';

      const patient = manager.create(Patient, {
        tenantId,
        mrn: data.mrn, // MUST be provided — never auto-generated
        firstName,
        lastName,
        gender: data.gender as any,
        dob: data.dob,
        bloodGroup: data.bloodGroup as any,
        phone: data.phone,
        isActive: true,
      });
      const savedPatient = await manager.save(patient);

      // 2. Create OPD encounter
      const encounter = manager.create(Encounter, {
        tenantId,
        patientId: savedPatient.id,
        patientName: `${firstName} ${lastName}`,
        type: 'OPD',
        status: 'Planned',
        admissionDate: new Date().toISOString().split('T')[0],
        practitionerId: data.assignedDoctorId,
        practitionerName: data.assignedDoctorName,
      });
      const savedEncounter = await manager.save(encounter);

      // 3. Assign next token for the day
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tokenCount = await manager.count(OpdQueue, {
        where: { tenantId },
      });
      const nextToken = `OPD-${String(tokenCount + 1).padStart(3, '0')}`;

      // 4. Create queue entry
      const queueEntry = manager.create(OpdQueue, {
        tenantId,
        encounterId: savedEncounter.id,
        patientId: savedPatient.id,
        patientName: `${firstName} ${lastName}`,
        mrn: savedPatient.mrn,
        departmentId: data.departmentId,
        departmentName: data.department,
        assignedDoctorId: data.assignedDoctorId,
        assignedDoctorName: data.assignedDoctorName,
        tokenNumber: nextToken,
        status: 'Waiting',
        chiefComplaint: data.chiefComplaint,
      });
      const savedQueue = await manager.save(queueEntry);

      // 5. Link queue back to encounter
      savedEncounter.opdQueueId = savedQueue.id;
      await manager.save(savedEncounter);

      await this.auditLog.log({
        tenantId, userId: actorId, action: 'CREATE',
        entityName: 'WalkIn', entityId: savedEncounter.id,
        changes: { patientId: savedPatient.id, mrn: savedPatient.mrn, token: nextToken },
      });

      return {
        success: true,
        token: nextToken,
        queueId: savedQueue.id,
        patientId: savedPatient.id,
        encounterId: savedEncounter.id,
        mrn: savedPatient.mrn,
      };
    });
  }

  /** Transition a queue entry to a new status */
  async updateQueueStatus(
    id: string,
    newStatus: OpdQueueStatus,
    tenantId: string,
    actorId: string,
  ) {
    const entry = await this.queueRepo.findOne({ where: { id, tenantId } });
    if (!entry) throw new NotFoundException(`Queue entry ${id} not found`);

    const allowed = OPD_QUEUE_TRANSITIONS[entry.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid queue transition: '${entry.status}' → '${newStatus}'. ` +
        `Allowed: [${allowed.join(', ')}]`,
      );
    }

    const oldStatus = entry.status;
    entry.status = newStatus;

    if (newStatus === 'Called') entry.calledAt = new Date();
    if (newStatus === 'InConsultation') entry.consultationStartedAt = new Date();
    if (newStatus === 'Completed') entry.completedAt = new Date();

    await this.queueRepo.save(entry);

    await this.auditLog.log({
      tenantId, userId: actorId, action: 'UPDATE',
      entityName: 'OpdQueue', entityId: id,
      changes: { statusFrom: oldStatus, statusTo: newStatus },
    });

    return entry;
  }

  async getStats(tenantId: string) {
    const today = new Date().toISOString().split('T')[0];

    const queueCount = await this.encounterRepo.count({
      where: { tenantId, type: 'OPD', status: 'Planned' },
    });

    const seenToday = await this.encounterRepo.count({
      where: [
        { tenantId, type: 'OPD', status: 'InProgress', admissionDate: today },
        { tenantId, type: 'OPD', status: 'Discharged', admissionDate: today },
      ],
    });

    const waitingEntries = await this.queueRepo.find({
      where: { tenantId, status: 'Waiting' },
      select: ['createdAt'],
    });
    let avgWaitMin = 0;
    if (waitingEntries.length > 0) {
      const totalWait = waitingEntries.reduce(
        (sum, e) => sum + Math.max(0, Math.floor((Date.now() - new Date(e.createdAt).getTime()) / 60000)),
        0,
      );
      avgWaitMin = Math.round(totalWait / waitingEntries.length);
    }

    const dailyCap = 50;
    const totalToday = queueCount + seenToday;
    const capacityPct = Math.min(100, Math.round((totalToday / dailyCap) * 100));

    return { queueCount, seenToday, avgWaitMin, capacityPct, dailyCap };
  }
}
