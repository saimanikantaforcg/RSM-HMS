import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsReport } from '../entities/analytics-report.entity';
import { Stock } from '../entities/stock.entity';
import { Admission } from '../entities/admission.entity';
import { ErCase } from '../er/er-case.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsReport)
    private readonly reportRepo: Repository<AnalyticsReport>,
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    @InjectRepository(Admission)
    private readonly admissionRepo: Repository<Admission>,
    @InjectRepository(ErCase)
    private readonly erCaseRepo: Repository<ErCase>,
  ) {}

  async getAiPredictions(tenantId: string) {
    // 1. Calculate Active Pharmacy Alerts
    const stocks = await this.stockRepo.find({ where: { tenantId } });
    const pharmacyAlerts = stocks.filter(s => Number(s.quantity) <= Number(s.reorderLevel)).length;

    // 2. Average Length of Stay (LOS)
    const admitted = await this.admissionRepo.find({ where: { tenantId, status: 'Active' } });
    let totalDays = 0;
    const now = new Date();
    admitted.forEach(a => {
      const diffTime = Math.abs(now.getTime() - a.admissionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      totalDays += diffDays;
    });
    const averageLosDays = admitted.length > 0 ? (totalDays / admitted.length).toFixed(1) : '0';

    // 3. ER Wait Time — calculated from active (non-discharged) ER cases
    // Formula: base 15 min + 5 min per active case (triage model)
    const activeErCount = await this.erCaseRepo.count({
      where: [
        { tenantId, status: 'Triaged' },
        { tenantId, status: 'Awaiting Doctor' },
        { tenantId, status: 'Under Treatment' },
        { tenantId, status: 'In Trauma Bay' },
      ],
    });
    const predictedErWait = 15 + (activeErCount * 5);

    return {
      erWaitTimeMinutes: predictedErWait,
      averageLosDays,
      pharmacyAlerts
    };
  }

  async getReports(tenantId: string) {
    const reports = await this.reportRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' }
    });

    return reports.map(r => ({
      id: "RPT-" + r.id.substring(0, 5).toUpperCase(),
      name: r.name,
      type: r.type,
      author: r.author,
      date: r.createdAt.toISOString().split('T')[0]
    }));
  }

  async generateReport(tenantId: string, data: any) {
    const reportData = {
      timestamp: new Date().toISOString(),
      outcome: 'Success',
    };

    const report = this.reportRepo.create({
      tenantId,
      name: data.name || 'Custom Dynamic Report',
      type: data.type || 'Operational Efficiency',
      author: data.author || 'System',
      reportData
    });

    return await this.reportRepo.save(report);
  }
}
