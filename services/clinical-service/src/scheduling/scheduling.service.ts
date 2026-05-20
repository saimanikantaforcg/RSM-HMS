import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffRoster } from '../entities/staff-roster.entity';

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(StaffRoster)
    private readonly rosterRepo: Repository<StaffRoster>,
  ) {}

  async getShifts(tenantId: string): Promise<StaffRoster[]> {
    return this.rosterRepo.find({
      where: { tenantId },
      relations: ['user'],
      order: { date: 'DESC' },
      take: 200,
    });
  }

  async assignShift(data: any, tenantId: string): Promise<StaffRoster> {
    const shift = this.rosterRepo.create({
      tenantId,
      userId: data.userId,
      date: data.date,
      shiftType: data.shiftType ?? data.time ?? 'Morning',
      department: data.department ?? data.role ?? null,
      isOnCall: data.isOnCall ?? false,
      notes: data.notes ?? null,
    });
    return this.rosterRepo.save(shift);
  }
}
