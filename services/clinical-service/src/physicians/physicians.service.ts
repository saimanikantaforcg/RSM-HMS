import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class PhysiciansService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getPhysicians(tenantId: string) {
    const doctors = await this.userRepo.find({
      where: { tenantId, role: 'doctor' },
      select: ['id', 'firstName', 'lastName', 'email', 'specialty', 'licenseNumber', 'licenseExpiry', 'isActive', 'department'],
      order: { lastName: 'ASC' },
    });
    return doctors.map(d => ({
      id: d.id,
      name: `Dr. ${d.firstName} ${d.lastName}`,
      specialty: d.specialty ?? 'General',
      department: d.department ?? null,
      status: d.isActive ? 'Active' : 'Inactive',
      licenseExp: d.licenseExpiry ?? null,
      email: d.email,
    }));
  }

  async getCompensation(userId: string, tenantId: string) {
    const doc = await this.userRepo.findOne({ where: { id: userId, tenantId, role: 'doctor' } });
    if (!doc) return { error: 'Physician not found' };
    // RVU compensation is a financial calculation — real data would come from
    // an RVU tracking table. Return structure for now; wire to actual table later.
    return {
      providerId: doc.id,
      name: `Dr. ${doc.firstName} ${doc.lastName}`,
      specialty: doc.specialty ?? 'General',
      status: doc.isActive ? 'Active' : 'Inactive',
    };
  }
}
