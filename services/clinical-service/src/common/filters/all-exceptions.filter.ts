import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = (exception as any)?.response?.message || (exception as any)?.message || 'Internal server error';

    // 🛡️ Enterprise Hardening: Mask Database Implementation Details
    if ((exception as any).name === 'QueryFailedError') {
      httpStatus = HttpStatus.BAD_REQUEST;
      const detail = (exception as any).detail || '';
      
      if (detail.includes('already exists')) {
        message = 'Conflict: A record with this unique identifier already exists in our system.';
      } else if (detail.includes('violates foreign key')) {
        message = 'Dependency Error: This record cannot be deleted or modified because it is currently linked to other data.';
      } else {
        message = 'System Error: A database operation failed. Please contact your hospital administrator.';
      }
    }

    const responseBody = {
      success: false,
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message: Array.isArray(message) ? message[0] : message, // Standardize to single string for UI toasts
    };

    // Log the error for internal observability
    if (httpStatus >= 500) {
      this.logger.error(
        `[${httpStatus}] ${responseBody.path} - ${responseBody.message}`,
        (exception as Error).stack,
      );
    } else {
      this.logger.warn(`[${httpStatus}] ${responseBody.path} - ${responseBody.message}`);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
