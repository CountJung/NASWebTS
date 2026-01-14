import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { SystemService } from './system.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.interface';

@Controller('system')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('config')
  getConfig() {
    return this.systemService.getConfig();
  }

  @Post('config')
  updateConfig(
    @Body()
    body: {
      backendPort?: string;
      frontendPort?: string;
      logCleanupIntervalHours?: string | number;
      logRetentionDays?: string | number;
    },
  ) {
    return this.systemService.updateConfig(body);
  }

  @Get('logs')
  listLogs() {
    return this.systemService.listLogFiles();
  }

  @Get('logs/content')
  getLogContent(@Query('path') logPath: string, @Query('lines') lines?: string) {
    const n = lines ? Number(lines) : 500;
    return this.systemService.readLogTail(logPath, n);
  }
}
