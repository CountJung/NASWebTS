import { Controller, Get, Query, Res, Post, Body, Delete, UseInterceptors, UploadedFile, Patch } from '@nestjs/common';
import { FilesService } from './files.service';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  async listFiles(@Query('path') path: string) {
    return this.filesService.listFiles(path);
  }

  @Get('recent')
  async getRecentFiles() {
    return this.filesService.getRecentFiles();
  }

  @Get('trash')
  async getTrashFiles() {
    return this.filesService.getTrashFiles();
  }

  @Get('download')
  async downloadFile(@Query('path') path: string, @Res({ passthrough: true }) res: Response) {
    const { stream, fileName, size } = await this.filesService.downloadFile(path);
    
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': size,
    });

    return stream;
  }

  @Post('mkdir')
  async createDirectory(@Body() body: { path: string; name: string }) {
    return this.filesService.createDirectory(body.path, body.name);
  }

  @Post('restore')
  async restoreFile(@Body() body: { fileName: string }) {
    return this.filesService.restoreFile(body.fileName);
  }

  @Delete()
  async deleteFile(@Query('path') path: string) {
    return this.filesService.deleteFile(path);
  }

  @Patch('rename')
  async renameFile(@Body() body: { path: string; newName: string }) {
    return this.filesService.renameFile(body.path, body.newName);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('path') path: string) {
    return this.filesService.uploadFile(file, path);
  }
}
