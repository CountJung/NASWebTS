import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule, utilities as nestWinstonUtilities } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';
import 'winston-daily-rotate-file';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilesModule } from './files/files.module';
import { LogCleanupService } from './tasks/log-cleanup.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LogsModule } from './logs/logs.module';
import { SystemModule } from './system/system.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonUtilities.format.nestLike('NASWeb', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
        new winston.transports.DailyRotateFile({
          dirname: path.join(process.cwd(), 'logs'),
          filename: '%DATE%-app.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxSize: '20m',
          // maxFiles: '10d', // Handled by LogCleanupService
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `[${timestamp}] [${level.toUpperCase()}] [${context || 'App'}] ${message}`;
            }),
          ),
        }),
        new winston.transports.DailyRotateFile({
          dirname: path.join(process.cwd(), 'logs'),
          filename: '%DATE%-error.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          zippedArchive: false,
          maxSize: '20m',
          // maxFiles: '10d', // Handled by LogCleanupService
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            winston.format.printf(({ timestamp, level, message, context, stack }) => {
              return `[${timestamp}] [${level.toUpperCase()}] [${context || 'App'}] ${message} ${stack || ''}`;
            }),
          ),
        }),
      ],
    }),
    FilesModule,
    UsersModule,
    AuthModule,
    LogsModule,
    SystemModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService, LogCleanupService],
})
export class AppModule {}
