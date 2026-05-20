import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { LisService } from './lis.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateLabOrderDto, EnterResultDto } from './dto/lab-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('lab-orders')
export class LisController {
  constructor(private readonly lisService: LisService) {}

  /** GET /api/v1/lab-orders?page=1&limit=20 */
  @Get()
  @Roles('doctor', 'nurse', 'lab_technician', 'hospital_admin')
  findAll(@CurrentUser() user: any, @Query() query: PaginationDto) {
    return this.lisService.findAll(user.tenantId, query);
  }

  /** GET /api/v1/lab-orders/encounter/:encounterId */
  @Get('encounter/:encounterId')
  @Roles('doctor', 'nurse', 'lab_technician', 'hospital_admin', 'billing_officer')
  findByEncounter(
    @Param('encounterId') encounterId: string,
    @CurrentUser() user: any,
  ) {
    return this.lisService.findByEncounter(encounterId, user.tenantId);
  }

  /** GET /api/v1/lab-orders/:id */
  @Get(':id')
  @Roles('doctor', 'nurse', 'lab_technician', 'hospital_admin')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.lisService.findOne(id, user.tenantId);
  }

  /** POST /api/v1/lab-orders */
  @Post()
  @Roles('doctor', 'nurse', 'hospital_admin')
  create(@Body() dto: CreateLabOrderDto, @CurrentUser() user: any) {
    return this.lisService.create(dto, user.tenantId, user.id, user.name ?? user.email);
  }

  /** PATCH /api/v1/lab-orders/:id/sample-collected */
  @Patch(':id/sample-collected')
  @Roles('lab_technician', 'nurse', 'hospital_admin')
  markSampleCollected(@Param('id') id: string, @CurrentUser() user: any) {
    return this.lisService.markSampleCollected(id, user.tenantId, user.id);
  }

  /** PATCH /api/v1/lab-orders/:id/result */
  @Patch(':id/result')
  @Roles('lab_technician', 'doctor', 'hospital_admin')
  enterResult(
    @Param('id') id: string,
    @Body() dto: EnterResultDto,
    @CurrentUser() user: any,
  ) {
    return this.lisService.enterResult(id, user.tenantId, dto, user.id);
  }

  /** PATCH /api/v1/lab-orders/:id/verify */
  @Patch(':id/verify')
  @Roles('lab_technician', 'doctor', 'hospital_admin')
  verify(@Param('id') id: string, @CurrentUser() user: any) {
    return this.lisService.verify(id, user.tenantId, user.id);
  }

  /** PATCH /api/v1/lab-orders/:id/cancel */
  @Patch(':id/cancel')
  @Roles('doctor', 'hospital_admin')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.lisService.transition(id, user.tenantId, 'Cancelled', user.id);
  }
}

