import { Controller, Get, Param, Patch, Sse, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Observable } from 'rxjs';
import { Notification } from '../entities/notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Sse('stream')
  stream(@Req() req: Request & { user: { sub: string }, tenantId: string }): Observable<{ data: Notification }> {
    if (!req.user || !req.user.sub) throw new UnauthorizedException('SSE Stream requires live user auth');
    
    // Connect user to their personal unread alert stream over raw HTTP Long-Polling/SSE
    return this.notificationService.getEventStream(req.tenantId, req.user.sub);
  }

  @Get()
  async getUnread(@Req() req: Request & { user: { sub: string }, tenantId: string }) {
    return await this.notificationService.getUnread(req.tenantId, req.user.sub);
  }

  @Patch(':id/read')
  async markRead(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: string }, tenantId: string }
  ) {
    return await this.notificationService.markRead(req.tenantId, req.user.sub, id);
  }
}
