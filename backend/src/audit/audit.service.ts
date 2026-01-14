import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export type FileActionType =
  | 'LIST'
  | 'RECENT'
  | 'TRASH'
  | 'DOWNLOAD'
  | 'DOWNLOAD_MULTIPLE'
  | 'UPLOAD'
  | 'MKDIR'
  | 'DELETE'
  | 'RENAME'
  | 'RESTORE'
  | 'RESTORE_MULTIPLE';

export interface FileAuditEvent {
  action: FileActionType;
  success: boolean;
  userId?: string;
  email?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  paths?: string[];
  fileName?: string;
  fileSize?: number;
  durationMs?: number;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  private readonly logger: winston.Logger;

  constructor() {
    const auditDir = path.join(process.cwd(), 'logs', 'audit');
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.json(),
      ),
      transports: [
        new (winston.transports as any).DailyRotateFile({
          dirname: auditDir,
          filename: '%DATE%-file-actions.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
    });
  }

  logFileAction(event: FileAuditEvent) {
    this.logger.info(event);
  }
}
