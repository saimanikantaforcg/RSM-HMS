import { Controller, Get, Post, Body, Req, Sse, UseGuards, MessageEvent } from '@nestjs/common';
import { ErService } from './er.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TriageCaseDto } from './dto/triage-case.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';

@UseGuards(RolesGuard)
@Controller('er')
export class ErController {
  constructor(
    private readonly erService: ErService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get('cases')
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  getCases(@Req() req: any) {
    return this.erService.getCases(req.tenantId);
  }

  @Post('triage')
  @Roles('doctor', 'nurse', 'hospital_admin')
  triageCase(@Req() req: any, @Body() dto: TriageCaseDto) {
    return this.erService.triageCase(dto, req.tenantId);
  }

  /**
   * GET /er/stream — Server-Sent Events for live ER case board.
   * Browser subscribes once; new triage events push automatically.
   * Auth: JWT cookie is sent with EventSource via credentials:include.
   */
  @Sse('stream')
  @Roles('doctor', 'nurse', 'receptionist', 'hospital_admin')
  stream(@Req() req: any): Observable<MessageEvent> {
    const tenantId = req.tenantId;
    return fromEvent(this.eventEmitter, `er.update.${tenantId}`).pipe(
      map((data) => ({ data: JSON.stringify(data) } as MessageEvent)),
    );
  }
}
