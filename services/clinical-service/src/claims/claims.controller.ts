import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubmitClaimDto, SettleBatchDto } from './dto/claims.dto';

@UseGuards(RolesGuard)
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get('list')
  @Roles('billing_officer', 'hospital_admin')
  getClaims(@Req() req: any) {
    return this.claimsService.getClaims(req.tenantId);
  }

  @Post('submit')
  @Roles('billing_officer', 'hospital_admin')
  submitClaim(@Req() req: any, @Body() dto: SubmitClaimDto) {
    return this.claimsService.submitClaim(req.tenantId, dto);
  }

  @Post('settle-batch')
  @Roles('hospital_admin')
  settleBatch(@Req() req: any, @Body() dto: SettleBatchDto) {
    return this.claimsService.settleBatch(req.tenantId, dto);
  }
}
