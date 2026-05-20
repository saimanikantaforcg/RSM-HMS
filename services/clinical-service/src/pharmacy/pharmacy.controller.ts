import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DispenseMedicationDto } from './dto/dispense-medication.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  /**
   * GET /api/v1/pharmacy/dispense-queue
   * Returns all prescriptions with status Signed or PartiallyDispensed —
   * the pharmacist's worklist.
   */
  @Get('dispense-queue')
  @Roles('pharmacist', 'hospital_admin')
  getDispenseQueue(@CurrentUser() user: any, @Query() query: PaginationDto) {
    return this.pharmacyService.getDispenseQueue(user.tenantId, query);
  }

  /** GET /api/v1/pharmacy/dispenses — history of completed dispenses */
  @Get('dispenses')
  @Roles('pharmacist', 'doctor', 'nurse', 'hospital_admin')
  getDispenses(@CurrentUser() user: any, @Query() query: PaginationDto) {
    return this.pharmacyService.getDispenses(user.tenantId, query);
  }

  /**
   * POST /api/v1/pharmacy/dispense
   * Transaction-safe: deducts stock and records dispense atomically.
   */
  @Post('dispense')
  @Roles('pharmacist', 'hospital_admin')
  dispenseMedication(
    @Body() dto: DispenseMedicationDto,
    @CurrentUser() user: any,
  ) {
    return this.pharmacyService.dispenseMedication(user.tenantId, dto, user.id, user.name ?? user.email);
  }
}
