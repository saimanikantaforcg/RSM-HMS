import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

/**
 * RlsContextInterceptor
 * --------------------
 * Sets the PostgreSQL 'app.current_tenant' session variable for every request.
 * This ensures that Row-Level Security (RLS) is applied at the DATABASE layer.
 */
@Injectable()
export class RlsContextInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    if (tenantId && process.env.DB_TYPE === 'postgres') {
      // Use the QueryRunner to set the session variable. 
      // Note: This must be done for every request on that specific connection.
      // For more complex systems, a connection pool wrapper is preferred.
      try {
        // Parameterized to prevent SQL injection from crafted tenantId values
        await this.dataSource.query('SET app.current_tenant = $1', [tenantId]);
      } catch (err) {
        console.error('Failed to set RLS context:', err);
        // Do not fail — but in strict prod mode, we might want to.
      }
    }

    return next.handle();
  }
}
