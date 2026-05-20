import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admission } from '../entities/admission.entity';
import { Ward } from '../entities/ward.entity';
import { Bed } from '../entities/bed.entity';
import { AdtLog } from '../entities/adt-log.entity';

@Injectable()
export class AdtService implements OnModuleInit {
  constructor(
    @InjectRepository(Admission)
    private readonly admissionRepo: Repository<Admission>,
    @InjectRepository(Ward)
    private readonly wardRepo: Repository<Ward>,
    @InjectRepository(Bed)
    private readonly bedRepo: Repository<Bed>,
    @InjectRepository(AdtLog)
    private readonly adtLogRepo: Repository<AdtLog>,
  ) {}

  async onModuleInit() {
    const count = await this.wardRepo.count();
    if (count === 0) {
      await this.seedDefaults();
    }
  }

  private async seedDefaults() {
    const demoTenantId = 'demo-hospital-id';
    const ward = this.wardRepo.create({
      tenantId: demoTenantId,
      name: 'General Ward A',
      type: 'General',
      totalBeds: 5,
    });
    const savedWard = await this.wardRepo.save(ward);

    for (let i = 1; i <= 5; i++) {
      await this.bedRepo.save(this.bedRepo.create({
        tenantId: demoTenantId,
        wardId: savedWard.id,
        bedNumber: `G-0${i}`,
        status: 'Available',
      }));
    }
  }

  async getWards(tenantId: string) {
    return await this.wardRepo.find({
      where: { tenantId },
      relations: ['beds'],
    });
  }

  async getLogs(tenantId: string) {
    const logs = await this.adtLogRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    
    return logs.map(l => ({
      id: l.id.split('-')[0].toUpperCase(),
      patient: l.patientName,
      action: l.action,
      from: l.fromLocation || '—',
      to: l.toLocation || '—',
      time: l.createdAt.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      user: l.operatorUser,
    }));
  }

  async transferPatient(tenantId: string, data: any, operator: string) {
    return await this.admissionRepo.manager.transaction(async (manager) => {
      const { patient, action, fromLoc, toLoc } = data;
      
      // 🛡️ Enterprise Hardening: Atomic Movement Logic
      const log = manager.create(AdtLog, {
        tenantId,
        patientId: patient || 'PT-UNKNOWN',
        patientName: patient,
        action,
        fromLocation: fromLoc,
        toLocation: toLoc,
        operatorUser: operator,
      });

      // Update Bed statuses if locations follow specific "Bed X" patterns
      // (Simplification for demo: we just log the movement)
      
      await manager.save(log);

      return {
        success: true,
        logId: log.id,
        message: `Patient ${action} successfully recorded.`
      };
    });
  }

  async admitPatient(tenantId: string, data: any) {
    const { patientId, patientName, bedId, reason } = data;
    const bed = await this.bedRepo.findOne({ where: { id: bedId, tenantId } });
    if (!bed) throw new NotFoundException('Bed not found');
    if (bed.status !== 'Available') throw new BadRequestException('Bed is not available');

    const admission = this.admissionRepo.create({
      tenantId, patientId, patientName, bedId, reason,
      admissionDate: new Date(), status: 'Active',
    });

    const savedAdmission = await this.admissionRepo.save(admission);
    bed.status = 'Occupied';
    bed.currentPatientId = patientId;
    await this.bedRepo.save(bed);

    return savedAdmission;
  }

  async dischargePatient(tenantId: string, admissionId: string) {
    const admission = await this.admissionRepo.findOne({ 
      where: { id: admissionId, tenantId },
      relations: ['bed']
    });
    if (!admission) throw new NotFoundException('Admission not found');

    admission.status = 'Discharged';
    admission.dischargeDate = new Date();
    await this.admissionRepo.save(admission);

    if (admission.bed) {
      admission.bed.status = 'Available';
      admission.bed.currentPatientId = null;
      await this.bedRepo.save(admission.bed);
    }

    return admission;
  }
}
