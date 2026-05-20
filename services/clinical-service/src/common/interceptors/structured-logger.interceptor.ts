import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { logger } from '../logging/winston.config';

/**
 * StructuredLoggerInterceptor — Production-Grade JSON Logging
 * 
 * Captures request details and results in a structured format suitable for
 * Loki, ELK, or Datadog. Includes X-Request-ID correlation.
 */
@Injectable()
export class StructuredLoggerInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_errors_total') private readonly errorsCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds') private readonly latencyHistogram: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers } = request;
    const requestId = headers['x-request-id'] || 'no-id';
    const tenantId = request.tenantId || 'system';
    const userId = request.user?.sub || 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;

          this.latencyHistogram.observe(
            { method, path: url, status: statusCode.toString() },
            duration / 1000
          );

          logger.info(`${method} ${url} ${statusCode} - ${duration}ms`, {
            requestId,
            tenantId,
            userId,
            method,
            url,
            statusCode,
            duration,
          });
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          const status = err.status || 500;

          this.errorsCounter.inc({ method, status: status.toString(), path: url });
          this.latencyHistogram.observe(
            { method, path: url, status: status.toString() },
            duration / 1000
          );

          logger.error(`${method} ${url} FAILED - ${duration}ms`, {
            requestId,
            tenantId,
            userId,
            method,
            url,
            error: err.message,
            stack: err.stack,
            duration,
          });
        },
      }),
    );
  }
}
