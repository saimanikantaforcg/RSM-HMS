import {
  Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus
} from '@nestjs/common';
import { EncountersService } from './encounters.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { UpdateEncounterStatusDto } from './dto/update-encounter-status.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('encounters')
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) { }

  /** GET /api/v1/encounters?page=1&limit=20 */
  @Get()
  @Roles('doctor', 'nurse', 'hospital_admin', 'receptionist')
  getAll(
    @CurrentUser() user: any,
    @Query() query: PaginationDto,
  ) {
    return this.encountersService.findAll(user.tenantId, query);
  }

  /** GET /api/v1/encounters/patient/:patientId */
  @Get('patient/:patientId')
  @Roles('doctor', 'nurse', 'hospital_admin', 'receptionist', 'billing_officer')
  getByPatient(@Param('patientId') patientId: string, @CurrentUser() user: any) {
    return this.encountersService.findByPatient(patientId, user.tenantId);
  }

  /** GET /api/v1/encounters/:id */
  @Get(':id')
  @Roles('doctor', 'nurse', 'hospital_admin', 'receptionist', 'billing_officer')
  getOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.encountersService.findOne(id, user.tenantId);
  }

  /** POST /api/v1/encounters */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  create(@Body() dto: CreateEncounterDto, @CurrentUser() user: any) {
    return this.encountersService.create(dto, user.tenantId, user.id, user.name);
  }

  /** PATCH /api/v1/encounters/:id/status */
  @Patch(':id/status')
  @Roles('doctor', 'nurse', 'hospital_admin')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEncounterStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.encountersService.updateStatus(id, user.tenantId, dto.status);
  }
}
