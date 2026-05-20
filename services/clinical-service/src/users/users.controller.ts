import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateUserRequestDto, UpdateUserDto, CreateRosterDto } from './dto/user-request.dto';

@ApiTags('users')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('hospital_admin', 'super_admin', 'hr', 'admin')
  @ApiOperation({ summary: 'List all staff members for the tenant' })
  findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user.tenantId);
  }

  @Get('physicians')
  @Roles('hospital_admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'admin')
  @ApiOperation({ summary: 'List all clinical doctors for the tenant' })
  getPhysicians(@CurrentUser() user: any) {
    return this.usersService.getPhysicians(user.tenantId);
  }

  @Post()
  @Roles('hospital_admin', 'super_admin', 'hr', 'admin')
  @ApiOperation({ summary: 'Create a new staff user' })
  create(@Body() dto: CreateUserRequestDto, @CurrentUser() user: any) {
    const createDto = { ...dto, passwordHash: dto.password, role: dto.role as any };
    return this.usersService.create(createDto, user.tenantId);
  }

  // ─── Attendance ────────────────────────────────────────────────────────
  @Post('clock-in')
  @Roles('doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'admin')
  @ApiOperation({ summary: 'Digital clock-in for the current staff member' })
  clockIn(@CurrentUser() user: any, @Body('location') location: string) {
    return this.usersService.clockIn(user.tenantId, user.userId, location);
  }

  @Post('clock-out')
  @Roles('doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'admin')
  @ApiOperation({ summary: 'Digital clock-out for the current staff member' })
  clockOut(@CurrentUser() user: any) {
    return this.usersService.clockOut(user.tenantId, user.userId);
  }

  @Get('attendance')
  @Roles('hospital_admin', 'hr', 'admin')
  @ApiOperation({ summary: 'Master attendance history' })
  getAttendance(@CurrentUser() user: any) {
    return this.usersService.getAttendanceHistory(user.tenantId);
  }

  // ─── Roster ────────────────────────────────────────────────────────────
  @Get('roster')
  @Roles('hospital_admin', 'hr', 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'admin')
  @ApiOperation({ summary: 'Weekly shift roster' })
  getRoster(@CurrentUser() user: any) {
    return this.usersService.getRoster(user.tenantId);
  }

  @Post('roster')
  @Roles('hospital_admin', 'hr', 'admin')
  @ApiOperation({ summary: 'Assign a new duty shift' })
  createRoster(@CurrentUser() user: any, @Body() dto: CreateRosterDto) {
    return this.usersService.createRoster(user.tenantId, dto);
  }

  @Patch(':id/toggle')
  @Roles('hospital_admin', 'super_admin', 'hr', 'admin')
  @ApiOperation({ summary: 'Activate/Deactivate a staff member' })
  toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.toggleActive(id, user.tenantId);
  }

  @Patch(':id')
  @Roles('hospital_admin', 'super_admin', 'hr', 'admin')
  @ApiOperation({ summary: 'Update staff member details' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    return this.usersService.update(id, dto, user.tenantId);
  }

  @Get('security-audit')
  @Roles('hospital_admin', 'super_admin', 'admin')
  @ApiOperation({ summary: 'Get global zero-trust security logs' })
  getSecurityAudit(@CurrentUser() user: any) {
    return this.usersService.getSecurityAudit(user.tenantId);
  }

  @Post('enforce-mfa')
  @Roles('hospital_admin', 'super_admin', 'admin')
  @ApiOperation({ summary: 'Enforce global MFA policy' })
  enforceMfa() {
    return this.usersService.enforceMfa();
  }
}
