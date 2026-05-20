import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PhysiciansService } from './physicians.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(RolesGuard)
@Controller('physicians')
export class PhysiciansController {
  constructor(private readonly physiciansService: PhysiciansService) {}

  @Get('directory')
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  getPhysicians(@Req() req: any) {
    return this.physiciansService.getPhysicians(req.tenantId);
  }

  @Get('compensation/:id')
  @Roles('hospital_admin', 'super_admin')
  getCompensation(@Param('id') id: string, @Req() req: any) {
    return this.physiciansService.getCompensation(id, req.tenantId);
  }
}
