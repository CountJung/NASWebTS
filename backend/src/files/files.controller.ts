import { Controller, Get, Query, Res, Post, Body, Delete, UseInterceptors, UploadedFile, Patch, StreamableFile, UseGuards } from '@nestjs/common';
import { FilesService } from './files.service';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.interface';
import { FileAuditInterceptor } from '../audit/file-audit.interceptor';

@Controller('files')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(FileAuditInterceptor)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.GUEST)
  async listFiles(@Query('path') path: string) {
    return this.filesService.listFiles(path);
  }

  @Get('recent')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.GUEST)
  async getRecentFiles() {
    return this.filesService.getRecentFiles();
  }

  @Get('trash')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.GUEST)
  async getTrashFiles() {
    return this.filesService.getTrashFiles();
  }

  @Get('download')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.GUEST)
  async downloadFile(@Query('path') path: string, @Res({ passthrough: true }) res: Response) {
    const { stream, fileName, size } = await this.filesService.downloadFile(path);
    
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': size,
    });

    return stream;
  }

  @Post('download-multiple')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.GUEST)
  async downloadMultipleFiles(@Body() body: { paths: string[] }, @Res({ passthrough: true }) res: Response) {
    console.log('Received download-multiple request with paths:', body.paths);
    const { stream, fileName } = await this.filesService.downloadMultipleFiles(body.paths);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(stream);
  }

  @Post('mkdir')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async createDirectory(@Body() body: { path: string; name: string }) {
    return this.filesService.createDirectory(body.path, body.name);
  }

  @Post('restore')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async restoreFile(@Body() body: { fileName: string }) {
    return this.filesService.restoreFile(body.fileName);
  }

  @Post('restore-multiple')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async restoreMultipleFiles(@Body() body: { fileNames: string[] }) {
    return this.filesService.restoreMultipleFiles(body.fileNames);
  }

  @Delete()
  @Roles(UserRole.ADMIN, UserRole.USER)
  async deleteFile(@Query('path') path: string) {
    return this.filesService.deleteFile(path);
  }

  @Patch('rename')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async renameFile(@Body() body: { path: string; newName: string }) {
    return this.filesService.renameFile(body.path, body.newName);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.ADMIN, UserRole.USER)
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('path') path: string) {
    return this.filesService.uploadFile(file, path);
  }
}
