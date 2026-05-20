import { Controller, Get, Post, Body, Req, UseGuards, UseInterceptors, Sse, MessageEvent } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { BedsService } from './beds.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateBedStateDto } from './dto/update-bed-state.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';

@UseGuards(RolesGuard)
@Controller('beds')
export class BedsController {
  constructor(
    private readonly bedsService: BedsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('beds')
  @CacheTTL(30_000) // 30 seconds — bed status changes frequently
  getBeds(@Req() req: any) {
    return this.bedsService.getBeds(req.tenantId);
  }

  @Post('update')
  @Roles('nurse', 'hospital_admin')
  updateBedState(@Req() req: any, @Body() dto: UpdateBedStateDto) {
    return this.bedsService.updateBedState(dto, req.tenantId);
  }

  /**
   * GET /beds/stream — Server-Sent Events for live bed status board.
   * Fires whenever any nurse updates a bed in this tenant.
   */
  @Sse('stream')
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  stream(@Req() req: any): Observable<MessageEvent> {
    const tenantId = req.tenantId;
    return fromEvent(this.eventEmitter, `bed.update.${tenantId}`).pipe(
      map((data) => ({ data: JSON.stringify(data) } as MessageEvent)),
    );
  }
}
