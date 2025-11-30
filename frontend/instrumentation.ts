import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { logger } from './lib/logger';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logger.info('Registering log cleanup cron job...');
    
    // Run every hour
    cron.schedule('0 * * * *', () => {
      logger.info('Running frontend log cleanup...');
      const logDir = path.join(process.cwd(), 'logs');
      
      if (!fs.existsSync(logDir)) return;

      const files = fs.readdirSync(logDir);
      const now = Date.now();
      const tenDaysInMillis = 10 * 24 * 60 * 60 * 1000;

      files.forEach(file => {
        const filePath = path.join(logDir, file);
        // Only delete files
        if (fs.statSync(filePath).isFile()) {
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > tenDaysInMillis) {
                try {
                    fs.unlinkSync(filePath);
                    logger.info(`Deleted old log file: ${file}`);
                } catch (err) {
                    logger.error(`Failed to delete log file ${file}`, err);
                }
            }
        }
      });
    });
  }
}
