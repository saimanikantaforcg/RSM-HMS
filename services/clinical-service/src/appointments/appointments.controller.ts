import { Controller, Get, Post, Body, Req, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Request } from 'express';
import { ScheduleAppointmentDto } from './dto/schedule-appointment.dto';

@UseGuards(RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @Roles('admin', 'doctor', 'receptionist', 'hospital_admin')
  async getAppointments(
    @Req() req: Request & { tenantId: string },
    @Query('date') date?: string,
    @Query('provider') provider?: string,
  ) {
    return await this.appointmentsService.getAppointments(req.tenantId, date, provider);
  }

  @Post('schedule')
  @Roles('admin', 'receptionist', 'hospital_admin')
  async scheduleAppointment(
    @Req() req: Request & { tenantId: string },
    @Body() dto: ScheduleAppointmentDto,
  ) {
    return await this.appointmentsService.scheduleAppointment(req.tenantId, dto);
  }
}
