import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { AppService } from './app.service';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello() {
    return { status: 'RSM HMS Clinical Service is LIVE' };
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
