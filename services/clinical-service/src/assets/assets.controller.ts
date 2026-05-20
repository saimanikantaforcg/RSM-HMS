import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ScheduleMaintenanceDto } from './dto/schedule-maintenance.dto';

@UseGuards(RolesGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('list')
  @Roles('hospital_admin')
  getAssets(@Req() req: any) {
    return this.assetsService.getAssets(req.tenantId);
  }

  @Post('maintenance')
  @Roles('hospital_admin')
  scheduleMaintenance(@Req() req: any, @Body() dto: ScheduleMaintenanceDto) {
    return this.assetsService.scheduleMaintenance(dto, req.tenantId);
  }

  @Get('rtls')
  @Roles('hospital_admin')
  getRtlsPositions(@Req() req: any) {
    return this.assetsService.getRtlsPositions(req.tenantId);
  }
}
