import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LogsService {
  private readonly logger = new Logger('Frontend');

  logFrontendError(errorData: any) {
    const { message, stack, url, userAgent, user } = errorData;
    this.logger.error(
      `[Frontend Error] ${message} - URL: ${url} - User: ${user || 'Anonymous'}`,
      stack,
    );
  }

  logFrontendInfo(infoData: any) {
    const { message, url, user } = infoData;
    this.logger.log(
      `[Frontend Info] ${message} - URL: ${url} - User: ${user || 'Anonymous'}`,
    );
  }
}
