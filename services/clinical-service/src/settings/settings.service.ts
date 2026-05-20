import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HospitalSettings } from '../entities/hospital-settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(HospitalSettings)
    private readonly settingsRepo: Repository<HospitalSettings>,
  ) {}

  async getConfig(tenantId: string) {
    const existing = await this.settingsRepo.findOne({ where: { tenantId } });
    if (existing) return existing;
    // Return defaults without persisting — first save happens on updateConfig
    return { tenantId, hospitalName: 'General Hospital', theme: 'Dark Mode', autoLogout: 15, notifications: true };
  }

  async updateConfig(tenantId: string, data: Partial<HospitalSettings>) {
    let settings = await this.settingsRepo.findOne({ where: { tenantId } });
    if (!settings) {
      settings = this.settingsRepo.create({ tenantId });
    }
    Object.assign(settings, data);
    return this.settingsRepo.save(settings);
  }
}
