import { Controller, Post, Body } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post('error')
  logError(@Body() body: any) {
    this.logsService.logFrontendError(body);
    return { success: true };
  }

  @Post('info')
  logInfo(@Body() body: any) {
    this.logsService.logFrontendInfo(body);
    return { success: true };
  }
}
