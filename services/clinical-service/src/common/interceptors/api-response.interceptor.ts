import {
    Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    timestamp: string;
}

/**
 * Wraps every successful NestJS response in the standard envelope:
 * { success: true, data: ..., timestamp: "..." }
 *
 * Responses that already have a `success` field (e.g. auth responses) are passed through.
 */
@Injectable()
export class ApiResponseInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((data) => {
                // Don't double-wrap if already has success key
                if (data && typeof data === 'object' && 'success' in data) {
                    return data;
                }
                return {
                    success: true,
                    data,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
}
