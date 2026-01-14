import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LogCleanupService {
  private readonly logger = new Logger(LogCleanupService.name);
  private readonly logDirectory = path.join(process.cwd(), 'logs');

  constructor(private readonly configService: ConfigService) {}

  @Cron(CronExpression.EVERY_HOUR)
  handleCron() {
    const intervalHoursRaw = Number(this.configService.get<string>('LOG_CLEANUP_INTERVAL_HOURS') || '1');
    const intervalHours = Number.isFinite(intervalHoursRaw)
      ? Math.max(1, Math.min(168, Math.floor(intervalHoursRaw)))
      : 1;

    const currentHour = new Date().getHours();
    const shouldRun = intervalHours === 1 ? true : currentHour % intervalHours === 0;

    if (!shouldRun) {
      this.logger.log(`Skipping log cleanup (intervalHours=${intervalHours})`);
      return;
    }

    this.logger.log(`Running log cleanup task (intervalHours=${intervalHours})...`);
    this.deleteOldLogs();
  }

  private deleteOldLogs() {
    if (!fs.existsSync(this.logDirectory)) {
      return;
    }

    const now = Date.now();
    const retentionDays = Number(this.configService.get<string>('LOG_RETENTION_DAYS') || '10');
    const keepDays = Number.isFinite(retentionDays) ? Math.max(1, Math.min(365, Math.floor(retentionDays))) : 10;
    const maxAgeMs = keepDays * 24 * 60 * 60 * 1000;

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
          continue;
        }

        try {
          const stats = fs.statSync(fullPath);
          if (now - stats.mtimeMs > maxAgeMs) {
            fs.unlinkSync(fullPath);
            this.logger.log(`Deleted old log file: ${path.relative(this.logDirectory, fullPath)}`);
          }
        } catch (err: any) {
          this.logger.error(`Failed to delete log file ${fullPath}: ${err?.message || err}`);
        }
      }
    };

    walk(this.logDirectory);
  }
}
