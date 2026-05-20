import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PortalService } from './portal.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SendPortalMessageDto } from './dto/send-message.dto';

@UseGuards(RolesGuard)
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('messages')
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  getMessages(@Req() req: any) {
    return this.portalService.getMessages(req.tenantId, req.user?.sub);
  }

  @Post('message')
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  sendMessage(@Req() req: any, @Body() dto: SendPortalMessageDto) {
    return this.portalService.sendMessage(dto, req.tenantId, req.user?.sub);
  }
}
