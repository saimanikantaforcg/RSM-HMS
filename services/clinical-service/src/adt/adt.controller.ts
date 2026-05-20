import { Controller, Get, Post, Body, Req, Param, UseGuards } from '@nestjs/common';
import { AdtService } from './adt.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Request } from 'express';
import { TransferPatientDto, AdmitBedDto } from './dto/adt.dto';

@UseGuards(RolesGuard)
@Controller('adt')
export class AdtController {
  constructor(private readonly adtService: AdtService) {}

  @Get('logs')
  @Roles('admin', 'doctor', 'nurse', 'receptionist', 'hospital_admin')
  async getLogs(@Req() req: Request & { tenantId: string }) {
    return await this.adtService.getLogs(req.tenantId);
  }

  @Post('transfer')
  @Roles('admin', 'nurse', 'receptionist', 'hospital_admin')
  async transferPatient(
    @Req() req: Request & { tenantId: string; user: any },
    @Body() dto: TransferPatientDto,
  ) {
    const operator = req.user?.name || 'Staff User';
    return await this.adtService.transferPatient(req.tenantId, dto, operator);
  }

  @Post('admit')
  @Roles('admin', 'nurse', 'receptionist', 'hospital_admin')
  async admitPatient(
    @Req() req: Request & { tenantId: string },
    @Body() dto: AdmitBedDto,
  ) {
    return await this.adtService.admitPatient(req.tenantId, dto);
  }

  @Post('discharge/:id')
  @Roles('admin', 'nurse', 'doctor', 'hospital_admin')
  async dischargePatient(
    @Req() req: Request & { tenantId: string },
    @Param('id') id: string,
  ) {
    return await this.adtService.dischargePatient(req.tenantId, id);
  }
}
