import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RadiologyReport } from './radiology-report.entity';

@Injectable()
export class RadiologyService {
  constructor(
    @InjectRepository(RadiologyReport)
    private readonly reportRepo: Repository<RadiologyReport>,
  ) {}

  async getReports(tenantId: string): Promise<RadiologyReport[]> {
    return this.reportRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async uploadReport(data: any, tenantId: string): Promise<RadiologyReport> {
    const report = this.reportRepo.create({
      tenantId,
      patientId: data.patientId ?? null,
      patient: data.patient ?? null,
      modality: data.modality,
      region: data.region ?? null,
      status: 'Draft',
      radiologist: data.radiologist ?? null,
      radiologistId: data.radiologistId ?? null,
      findings: data.findings ?? null,
      fileUrl: data.fileUrl ?? null,
    });
    return this.reportRepo.save(report);
  }
}
