import winston from 'winston';
import path from 'path';
import 'winston-daily-rotate-file';

const logDir = path.join(process.cwd(), 'logs');

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      dirname: logDir,
      filename: '%DATE%-error.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
    }),
    new winston.transports.DailyRotateFile({
      dirname: logDir,
      filename: '%DATE%-combined.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
