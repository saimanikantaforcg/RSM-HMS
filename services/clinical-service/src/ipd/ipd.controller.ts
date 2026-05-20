import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { IpdService } from './ipd.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdmitPatientDto } from './dto/admit-patient.dto';

@UseGuards(RolesGuard)
@Controller('ipd')
export class IpdController {
  constructor(private readonly ipdService: IpdService) {}

  @Get('patients')
  @Roles('nurse', 'doctor', 'hospital_admin')
  getPatients(@CurrentUser() user: any) {
    return this.ipdService.getPatients(user.tenantId);
  }

  @Post('admit')
  @Roles('receptionist', 'nurse', 'doctor', 'hospital_admin')
  admitPatient(@Body() dto: AdmitPatientDto, @CurrentUser() user: any) {
    return this.ipdService.admitPatient(user.tenantId, dto);
  }
}
