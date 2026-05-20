import {
  Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus
} from '@nestjs/common';
import { EprescribingService } from './eprescribing.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { AddPrescriptionItemDto } from './dto/add-prescription-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('prescriptions')
export class EprescribingController {
  constructor(private readonly svc: EprescribingService) {}

  /** GET /api/v1/prescriptions?page=1&limit=20 */
  @Get()
  @Roles('doctor', 'nurse', 'pharmacist', 'hospital_admin')
  findAll(@CurrentUser() user: any, @Query() query: PaginationDto) {
    return this.svc.findAll(user.tenantId, query);
  }

  /** GET /api/v1/prescriptions/encounter/:encounterId */
  @Get('encounter/:encounterId')
  @Roles('doctor', 'nurse', 'pharmacist', 'hospital_admin', 'billing_officer')
  findByEncounter(
    @Param('encounterId') encounterId: string,
    @CurrentUser() user: any,
  ) {
    return this.svc.findByEncounter(encounterId, user.tenantId);
  }

  /** GET /api/v1/prescriptions/:id */
  @Get(':id')
  @Roles('doctor', 'nurse', 'pharmacist', 'hospital_admin')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.findOne(id, user.tenantId);
  }

  /** POST /api/v1/prescriptions — create prescription for an encounter */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('doctor', 'hospital_admin')
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: any) {
    return this.svc.create(dto, user.tenantId, user.id, user.name ?? user.email);
  }

  /** POST /api/v1/prescriptions/:id/items — add drug line */
  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  @Roles('doctor', 'hospital_admin')
  addItem(
    @Param('id') id: string,
    @Body() dto: AddPrescriptionItemDto,
    @CurrentUser() user: any,
  ) {
    return this.svc.addItem(id, dto, user.tenantId);
  }

  /** PATCH /api/v1/prescriptions/:id/sign — doctor signs the prescription */
  @Patch(':id/sign')
  @Roles('doctor', 'hospital_admin')
  sign(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.transition(id, user.tenantId, 'Signed');
  }

  /** PATCH /api/v1/prescriptions/:id/cancel */
  @Patch(':id/cancel')
  @Roles('doctor', 'hospital_admin')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.transition(id, user.tenantId, 'Cancelled');
  }
}
