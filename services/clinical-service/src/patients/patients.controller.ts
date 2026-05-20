import {
    Controller, Get, Post, Put, Delete, Body, Param,
    Query, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('patients')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('patients')
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    /** GET /api/v1/patients?page=1&limit=20&search=
     * All clinical staff can view patients
     */
    @Get()
    @Roles('receptionist', 'nurse', 'doctor', 'billing_officer', 'hospital_admin')
    getAll(
        @CurrentUser() user: any,
        @Query() query: PaginationDto,
    ) {
        return this.patientsService.findAll(user.tenantId, query);
    }

    /** GET /api/v1/patients/:id */
    @Get(':id')
    @Roles('receptionist', 'nurse', 'doctor', 'billing_officer', 'hospital_admin')
    getOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.patientsService.findOne(id, user.tenantId);
    }

    /** POST /api/v1/patients — Receptionists and above can create patients */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles('receptionist', 'nurse', 'doctor', 'hospital_admin')
    create(@Body() dto: CreatePatientDto, @CurrentUser() user: any) {
        return this.patientsService.create(dto, user.tenantId);
    }

    /** PUT /api/v1/patients/:id — Nurses and above can update */
    @Put(':id')
    @Roles('nurse', 'doctor', 'hospital_admin')
    update(
        @Param('id') id: string,
        @Body() dto: Partial<CreatePatientDto>,
        @CurrentUser() user: any,
    ) {
        return this.patientsService.update(id, user.tenantId, dto);
    }

    /** GET /api/v1/patients/:id/timeline
     * Chronological clinical history across encounters, prescriptions, lab orders, vitals
     */
    @Get(':id/timeline')
    @Roles('nurse', 'doctor', 'hospital_admin')
    getTimeline(@Param('id') id: string, @CurrentUser() user: any) {
        return this.patientsService.getTimeline(id, user.tenantId);
    }

    /** DELETE /api/v1/patients/:id — Restricted to hospital_admin only */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @Roles('hospital_admin')
    deactivate(@Param('id') id: string, @CurrentUser() user: any) {
        return this.patientsService.deactivate(id, user.tenantId);
    }

    /** POST /api/v1/patients/seed-demo — Dev only, admin only */
    @Post('seed-demo')
    @Roles('hospital_admin')
    seedDemo(@CurrentUser() user: any) {
        return this.patientsService.seedDemoPatients(user.tenantId);
    }
}
