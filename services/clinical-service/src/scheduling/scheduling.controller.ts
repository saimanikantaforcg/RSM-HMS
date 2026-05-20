import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AssignShiftDto } from './dto/assign-shift.dto';

@UseGuards(RolesGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('shifts')
  @Roles('doctor', 'nurse', 'hospital_admin', 'hr')
  getShifts(@Req() req: any) {
    return this.schedulingService.getShifts(req.tenantId);
  }

  @Post('assign')
  @Roles('hospital_admin', 'hr')
  assignShift(@Req() req: any, @Body() dto: AssignShiftDto) {
    return this.schedulingService.assignShift(dto, req.tenantId);
  }
}
