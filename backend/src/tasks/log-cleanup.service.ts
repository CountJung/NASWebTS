import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LogCleanupService {
  private readonly logger = new Logger(LogCleanupService.name);
  private readonly logDirectory = path.join(process.cwd(), 'logs');

  @Cron(CronExpression.EVERY_HOUR)
  handleCron() {
    this.logger.log('Running log cleanup task...');
    this.deleteOldLogs();
  }

  private deleteOldLogs() {
    if (!fs.existsSync(this.logDirectory)) {
      return;
    }

    const files = fs.readdirSync(this.logDirectory);
    const now = Date.now();
    const tenDaysInMillis = 10 * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      const filePath = path.join(this.logDirectory, file);
      // Only delete files, not directories
      if (fs.statSync(filePath).isFile()) {
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > tenDaysInMillis) {
          try {
            fs.unlinkSync(filePath);
            this.logger.log(`Deleted old log file: ${file}`);
          } catch (err) {
            this.logger.error(`Failed to delete log file ${file}: ${err.message}`);
          }
        }
      }
    });
  }
}
