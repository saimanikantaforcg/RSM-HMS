import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { OtService } from './ot.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ScheduleSurgeryDto } from './dto/schedule-surgery.dto';

@UseGuards(RolesGuard)
@Controller('ot')
export class OtController {
  constructor(private readonly otService: OtService) {}

  @Get('surgeries')
  @Roles('doctor', 'nurse', 'hospital_admin')
  getSurgeries(@Req() req: any) {
    return this.otService.getSurgeries(req.tenantId);
  }

  @Post('schedule')
  @Roles('doctor', 'hospital_admin')
  scheduleSurgery(@Req() req: any, @Body() dto: ScheduleSurgeryDto) {
    return this.otService.scheduleSurgery(req.tenantId, dto);
  }
}
