import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { OpdService } from './opd.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RegisterWalkInDto } from './dto/register-walk-in.dto';

@Controller('opd')
export class OpdController {
  constructor(private readonly opdService: OpdService) {}

  @Get('queue')
  @Roles('receptionist', 'nurse', 'doctor', 'hospital_admin')
  getQueue(
    @CurrentUser() user: any,
    @Query('departmentId') departmentId?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.opdService.getQueue(user.tenantId, { departmentId, doctorId });
  }

  @Get('stats')
  @Roles('receptionist', 'nurse', 'doctor', 'hospital_admin')
  getStats(@CurrentUser() user: any) {
    return this.opdService.getStats(user.tenantId);
  }

  /**
   * POST /api/v1/opd/register
   * Creates Patient + Encounter + OpdQueue entry atomically.
   */
  @Post('register')
  @Roles('receptionist', 'nurse', 'hospital_admin')
  registerWalkIn(@Body() dto: RegisterWalkInDto, @CurrentUser() user: any) {
    return this.opdService.registerWalkIn(
      user.tenantId,
      dto,
      user.id,
      user.name ?? user.email,
    );
  }

  /**
   * PATCH /api/v1/opd/queue/:id/status
   * Transitions queue entry status (Waiting → Called → InConsultation → Completed).
   */
  @Patch('queue/:id/status')
  @Roles('receptionist', 'nurse', 'doctor', 'hospital_admin')
  updateQueueStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.opdService.updateQueueStatus(id, status as any, user.tenantId, user.id);
  }
}
