import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { AuditModule } from '../audit/audit.module';
import { FileAuditInterceptor } from '../audit/file-audit.interceptor';

@Module({
  imports: [AuditModule],
  controllers: [FilesController],
  providers: [FilesService, FileAuditInterceptor]
})
export class FilesModule {}
