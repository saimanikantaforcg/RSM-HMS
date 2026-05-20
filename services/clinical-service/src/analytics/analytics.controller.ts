import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IsNotEmpty, IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

class GenerateReportDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsIn(['Operational Efficiency', 'Financial', 'Clinical Outcomes', 'HIPAA Compliance', 'Inventory'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;
}

@UseGuards(RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('predictions')
  @Roles('admin', 'hospital_admin', 'super_admin')
  async getPredictions(@Req() req: Request & { tenantId: string }) {
    return await this.analyticsService.getAiPredictions(req.tenantId);
  }

  @Get('reports')
  @Roles('admin', 'hospital_admin', 'super_admin', 'hr', 'billing_officer')
  async getReports(@Req() req: Request & { tenantId: string }) {
    return await this.analyticsService.getReports(req.tenantId);
  }

  @Post('generate')
  @Roles('admin', 'hospital_admin', 'super_admin', 'billing_officer')
  async generateReport(
    @Req() req: Request & { tenantId: string },
    @Body() dto: GenerateReportDto,
  ) {
    return await this.analyticsService.generateReport(req.tenantId, dto);
  }
}
