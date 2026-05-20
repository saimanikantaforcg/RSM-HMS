import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * RequestIdMiddleware — Global Correlation ID Logic
 * 
 * Attaches X-Request-ID to both the request and response headers.
 * Ensures every transaction can be traced across logs.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] || uuidv4();
    
    // Attach to request for internal use (interceptors/loggers)
    req.headers['x-request-id'] = requestId;
    
    // Attach to response for client-side correlation
    res.setHeader('X-Request-ID', requestId);
    
    next();
  }
}
