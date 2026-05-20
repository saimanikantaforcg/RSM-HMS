import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { RadiologyService } from './radiology.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadRadiologyReportDto } from './dto/upload-report.dto';

@UseGuards(RolesGuard)
@Controller('radiology')
export class RadiologyController {
  constructor(private readonly radiologyService: RadiologyService) {}

  @Get('reports')
  @Roles('doctor', 'nurse', 'hospital_admin')
  getReports(@Req() req: any) {
    return this.radiologyService.getReports(req.tenantId);
  }

  @Post('upload')
  @Roles('doctor', 'hospital_admin')
  uploadReport(@Req() req: any, @Body() dto: UploadRadiologyReportDto) {
    return this.radiologyService.uploadReport(dto, req.tenantId);
  }
}
