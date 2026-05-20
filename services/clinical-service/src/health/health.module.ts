import { Module, Controller, Get, SetMetadata } from '@nestjs/common';
import { TerminusModule, HealthCheckService, HealthCheck, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';

@SetMetadata(IS_PUBLIC_KEY, true)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
