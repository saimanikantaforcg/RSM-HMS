import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { RcmService } from './rcm.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateRcmPipelineDto } from './dto/update-pipeline.dto';

@UseGuards(RolesGuard)
@Controller('rcm')
export class RcmController {
  constructor(private readonly rcmService: RcmService) {}

  @Get('pipeline')
  @Roles('billing_officer', 'hospital_admin')
  getPipeline(@Req() req: any) {
    return this.rcmService.getPipeline(req.tenantId);
  }

  @Post('update')
  @Roles('billing_officer', 'hospital_admin')
  updatePipeline(@Req() req: any, @Body() dto: UpdateRcmPipelineDto) {
    return this.rcmService.updatePipeline(req.tenantId, dto);
  }
}
