import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async getAppointments(tenantId: string, date?: string, providerName?: string) {
    const query = this.appointmentRepo.createQueryBuilder('apt')
      .where('apt.tenantId = :tenantId', { tenantId });

    if (date) {
      query.andWhere('apt.date = :date', { date });
    }

    if (providerName && providerName !== 'All') {
      query.andWhere('apt.providerName = :providerName', { providerName });
    }

    return await query.orderBy('apt.time', 'ASC').getMany();
  }

  async scheduleAppointment(tenantId: string, data: any) {
    const appointment = this.appointmentRepo.create({
      ...data,
      tenantId,
      status: 'Scheduled',
    });

    return await this.appointmentRepo.save(appointment);
  }

  async updateStatus(tenantId: string, id: string, status: any) {
    const apt = await this.appointmentRepo.findOne({ where: { id, tenantId } });
    if (!apt) throw new NotFoundException('Appointment not found');
    
    apt.status = status;
    return await this.appointmentRepo.save(apt);
  }
}
