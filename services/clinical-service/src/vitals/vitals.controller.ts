import { Controller, Get, Post, Body, Req, Query, UseGuards } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RecordVitalsDto } from './dto/record-vitals.dto';

@UseGuards(RolesGuard)
@Controller('vitals')
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Get('history')
  @Roles('admin', 'doctor', 'nurse', 'receptionist', 'hospital_admin')
  async getVitals(
    @Req() req: Request & { tenantId: string },
    @Query('patientId') patientId: string,
  ) {
    return await this.vitalsService.getVitals(req.tenantId, patientId);
  }

  @Post('record')
  @Roles('admin', 'nurse', 'doctor', 'hospital_admin')
  async recordVitals(
    @Req() req: Request & { tenantId: string },
    @Body() dto: RecordVitalsDto,
  ) {
    return await this.vitalsService.recordVitals(req.tenantId, dto);
  }
}
