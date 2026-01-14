import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SystemService {
  private readonly backendEnvPath = path.join(process.cwd(), '.env');
  private readonly frontendEnvPath = path.join(process.cwd(), '../frontend/.env.local');
  private readonly logsRootPath = path.join(process.cwd(), 'logs');

  private parseEnv(content: string): Record<string, string> {
    const config: Record<string, string> = {};
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        config[match[1].trim()] = match[2].trim();
      }
    }
    return config;
  }

  private updateEnvVariable(content: string, key: string, value: string): string {
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(content)) {
      return content.replace(regex, `${key}=${value}`);
    } else {
      const prefix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
      return `${content}${prefix}${key}=${value}\n`;
    }
  }

  async getConfig() {
    let backendConfig: Record<string, string> = {};
    let frontendConfig: Record<string, string> = {};

    if (fs.existsSync(this.backendEnvPath)) {
      backendConfig = this.parseEnv(fs.readFileSync(this.backendEnvPath, 'utf8'));
    }
    if (fs.existsSync(this.frontendEnvPath)) {
      frontendConfig = this.parseEnv(fs.readFileSync(this.frontendEnvPath, 'utf8'));
    }

    return {
      backendPort: backendConfig['PORT'] || '4000',
      frontendPort: frontendConfig['PORT'] || '3000',
      logCleanupIntervalHours: backendConfig['LOG_CLEANUP_INTERVAL_HOURS'] || '1',
      logRetentionDays: backendConfig['LOG_RETENTION_DAYS'] || '10',
    };
  }

  async updateConfig(update: {
    backendPort?: string;
    frontendPort?: string;
    logCleanupIntervalHours?: string | number;
    logRetentionDays?: string | number;
  }) {
    // Read raw content to preserve comments and structure
    let backendContent = fs.existsSync(this.backendEnvPath) ? fs.readFileSync(this.backendEnvPath, 'utf8') : '';
    let frontendContent = fs.existsSync(this.frontendEnvPath) ? fs.readFileSync(this.frontendEnvPath, 'utf8') : '';

    const currentBackendConfig = this.parseEnv(backendContent);
    const currentFrontendConfig = this.parseEnv(frontendContent);

    const backendPort = update.backendPort || currentBackendConfig['PORT'] || '4000';
    const frontendPort = update.frontendPort || currentFrontendConfig['PORT'] || '3000';

    // Update Backend Config
    backendContent = this.updateEnvVariable(backendContent, 'PORT', backendPort);
    backendContent = this.updateEnvVariable(backendContent, 'FRONTEND_URL', `http://localhost:${frontendPort}`);
    
    // Update Google Callback URL if it exists
    // We parse the current content to check if the key exists and get its current value
    const currentBackendConfigAfterPort = this.parseEnv(backendContent);
    const currentCallbackUrl = currentBackendConfigAfterPort['GOOGLE_CALLBACK_URL'];
    if (currentCallbackUrl) {
      const newCallbackUrl = currentCallbackUrl.replace(
        /http:\/\/localhost:\d+/,
        `http://localhost:${backendPort}`
      );
      backendContent = this.updateEnvVariable(backendContent, 'GOOGLE_CALLBACK_URL', newCallbackUrl);
    }

    // Log cleanup settings (stored in backend .env)
    const intervalHoursRaw = update.logCleanupIntervalHours ?? currentBackendConfig['LOG_CLEANUP_INTERVAL_HOURS'] ?? '1';
    const retentionDaysRaw = update.logRetentionDays ?? currentBackendConfig['LOG_RETENTION_DAYS'] ?? '10';
    const intervalHours = String(intervalHoursRaw);
    const retentionDays = String(retentionDaysRaw);
    backendContent = this.updateEnvVariable(backendContent, 'LOG_CLEANUP_INTERVAL_HOURS', intervalHours);
    backendContent = this.updateEnvVariable(backendContent, 'LOG_RETENTION_DAYS', retentionDays);

    // Update Frontend Config
    frontendContent = this.updateEnvVariable(frontendContent, 'PORT', frontendPort);
    frontendContent = this.updateEnvVariable(frontendContent, 'NEXT_PUBLIC_BACKEND_URL', `http://localhost:${backendPort}`);

    // Write files
    fs.writeFileSync(this.backendEnvPath, backendContent);
    fs.writeFileSync(this.frontendEnvPath, frontendContent);

    return { success: true, message: 'Configuration updated. Please restart both servers.' };
  }

  private resolveLogPath(relativeLogPath: string): string {
    if (!relativeLogPath || typeof relativeLogPath !== 'string') {
      throw new BadRequestException('Invalid log path');
    }

    // normalize and prevent absolute paths
    const normalized = path.normalize(relativeLogPath).replace(/^[\/]+/, '');
    const fullPath = path.resolve(this.logsRootPath, normalized);

    if (!fullPath.startsWith(this.logsRootPath)) {
      throw new BadRequestException('Access denied');
    }
    return fullPath;
  }

  async listLogFiles() {
    if (!fs.existsSync(this.logsRootPath)) {
      return [];
    }

    const results: Array<{ path: string; size: number; updatedAt: string }> = [];

    const walk = (dir: string, prefix: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          walk(full, rel);
          continue;
        }

        // only log-like files
        if (!/\.(log|txt|json)$/i.test(entry.name)) continue;

        const stat = fs.statSync(full);
        results.push({
          path: rel.replace(/\\/g, '/'),
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
        });
      }
    };

    walk(this.logsRootPath, '');

    return results.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  async readLogTail(relativeLogPath: string, maxLines: number = 500) {
    const fullPath = this.resolveLogPath(relativeLogPath);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Log file not found');
    }

    const safeLines = Number.isFinite(maxLines) ? Math.max(10, Math.min(5000, Math.floor(maxLines))) : 500;

    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      throw new BadRequestException('Not a file');
    }

    // Read last up to 512KB to avoid loading huge files
    const maxBytes = 512 * 1024;
    const start = Math.max(0, stat.size - maxBytes);
    const fd = fs.openSync(fullPath, 'r');
    try {
      const buf = Buffer.alloc(stat.size - start);
      fs.readSync(fd, buf, 0, buf.length, start);
      const text = buf.toString('utf8');
      const lines = text.split(/\r?\n/);
      const tail = lines.slice(-safeLines).join('\n');
      return { path: relativeLogPath, lines: safeLines, content: tail };
    } finally {
      fs.closeSync(fd);
    }
  }
}
