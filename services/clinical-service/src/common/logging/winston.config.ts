import * as winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * Winston Configuration for Enterprise Production Logging
 * --------------------------------------------------------
 * - Outputs to Console (JSON in Prod, Pretty in Dev)
 * - Rotates log files for persistence
 * - Includes RequestID, TenantID, and UserID metadata
 */
export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, ms, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                return `[${timestamp}] ${level}: ${message} ${ms} ${metaStr}`;
              }),
            ),
      ),
    }),
    // Only use file rotation in non-test environments
    ...(process.env.NODE_ENV !== 'test'
      ? [
          new winston.transports.DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
        ]
      : []),
  ],
};

export const logger = winston.createLogger(winstonConfig);
