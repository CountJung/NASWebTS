import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SystemService {
  private readonly backendEnvPath = path.join(process.cwd(), '.env');
  private readonly frontendEnvPath = path.join(process.cwd(), '../frontend/.env.local');

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
    };
  }

  async updateConfig(backendPort: string, frontendPort: string) {
    // Read raw content to preserve comments and structure
    let backendContent = fs.existsSync(this.backendEnvPath) ? fs.readFileSync(this.backendEnvPath, 'utf8') : '';
    let frontendContent = fs.existsSync(this.frontendEnvPath) ? fs.readFileSync(this.frontendEnvPath, 'utf8') : '';

    // Update Backend Config
    backendContent = this.updateEnvVariable(backendContent, 'PORT', backendPort);
    backendContent = this.updateEnvVariable(backendContent, 'FRONTEND_URL', `http://localhost:${frontendPort}`);
    
    // Update Google Callback URL if it exists
    // We parse the current content to check if the key exists and get its current value
    const currentBackendConfig = this.parseEnv(backendContent);
    if (currentBackendConfig['GOOGLE_CALLBACK_URL']) {
      const newCallbackUrl = currentBackendConfig['GOOGLE_CALLBACK_URL'].replace(
        /http:\/\/localhost:\d+/,
        `http://localhost:${backendPort}`
      );
      backendContent = this.updateEnvVariable(backendContent, 'GOOGLE_CALLBACK_URL', newCallbackUrl);
    }

    // Update Frontend Config
    frontendContent = this.updateEnvVariable(frontendContent, 'PORT', frontendPort);
    frontendContent = this.updateEnvVariable(frontendContent, 'NEXT_PUBLIC_BACKEND_URL', `http://localhost:${backendPort}`);

    // Write files
    fs.writeFileSync(this.backendEnvPath, backendContent);
    fs.writeFileSync(this.frontendEnvPath, frontendContent);

    return { success: true, message: 'Configuration updated. Please restart both servers.' };
  }
}
