import { Controller, Get, Post, Body, Req, Query, UseGuards } from '@nestjs/common';
import { EmrService } from './emr.service';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateEmrNoteDto } from './dto/create-emr-note.dto';

@UseGuards(RolesGuard)
@Controller('emr')
export class EmrController {
  constructor(private readonly emrService: EmrService) {}

  @Get('notes')
  @Roles('admin', 'doctor', 'nurse', 'hospital_admin')
  async getNotes(
    @Req() req: Request & { tenantId: string },
    @Query('patientId') patientId: string,
  ) {
    return await this.emrService.getNotes(req.tenantId, patientId);
  }

  @Post('sign')
  @Roles('doctor', 'hospital_admin')
  async signNote(
    @Req() req: Request & { tenantId: string },
    @Body() dto: CreateEmrNoteDto,
  ) {
    return await this.emrService.signNote(req.tenantId, dto);
  }
}
