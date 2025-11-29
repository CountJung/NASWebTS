import { Injectable, BadRequestException, NotFoundException, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, existsSync, statSync } from 'fs';

export interface FileInfo {
  name: string;
  type: 'file' | 'directory';
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FilesService {
  private readonly rootPath: string;

  constructor(private readonly configService: ConfigService) {
    this.rootPath = path.resolve(this.configService.get<string>('ROOT_PATH') || './nas-storage');
    this.ensureRootPathExists();
  }

  private async ensureRootPathExists() {
    try {
      await fs.access(this.rootPath);
    } catch {
      await fs.mkdir(this.rootPath, { recursive: true });
    }
  }

  private validatePath(userPath: string): string {
    // 1. Normalize the path to handle '..' and separators
    const normalizedPath = path.normalize(userPath || '');

    // 2. Remove leading slashes/backslashes to ensure it's treated as relative
    const relativePath = normalizedPath.replace(/^[\/\\]+/, '');

    // 3. Resolve the full path
    const fullPath = path.resolve(this.rootPath, relativePath);

    // 4. Security Check: Ensure the resolved path is still within rootPath
    if (!fullPath.startsWith(this.rootPath)) {
      throw new BadRequestException('Access denied: Path traversal detected');
    }

    return fullPath;
  }

  async listFiles(userPath: string = ''): Promise<FileInfo[]> {
    const fullPath = this.validatePath(userPath);

    try {
      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        throw new BadRequestException('Path is not a directory');
      }

      const dirContent = await fs.readdir(fullPath, { withFileTypes: true });

      const files: FileInfo[] = await Promise.all(
        dirContent.map(async (dirent) => {
          const filePath = path.join(fullPath, dirent.name);
          try {
            const fileStats = await fs.stat(filePath);
            return {
              name: dirent.name,
              type: dirent.isDirectory() ? 'directory' : 'file',
              size: fileStats.size,
              createdAt: fileStats.birthtime,
              updatedAt: fileStats.mtime,
            };
          } catch (e) {
            // Handle case where file might be locked or inaccessible
            return null;
          }
        }),
      );

      return files.filter((f) => f !== null) as FileInfo[];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new NotFoundException(`Directory not found: ${userPath}`);
    }
  }

  async downloadFile(userPath: string): Promise<{ stream: StreamableFile; fileName: string; size: number }> {
    const fullPath = this.validatePath(userPath);

    if (!existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }

    const stats = statSync(fullPath);
    if (!stats.isFile()) {
      throw new BadRequestException('Path is not a file');
    }

    const fileStream = createReadStream(fullPath);
    return {
      stream: new StreamableFile(fileStream),
      fileName: path.basename(fullPath),
      size: stats.size,
    };
  }

  async createDirectory(userPath: string, folderName: string): Promise<void> {
    const fullPath = this.validatePath(path.join(userPath, folderName));
    
    try {
      await fs.mkdir(fullPath);
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        throw new BadRequestException('Directory already exists');
      }
      throw error;
    }
  }

  async deleteFile(userPath: string): Promise<void> {
    const fullPath = this.validatePath(userPath);

    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.unlink(fullPath);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('File or directory not found');
      }
      throw error;
    }
  }

  async renameFile(userPath: string, newName: string): Promise<void> {
    const fullPath = this.validatePath(userPath);
    const dirPath = path.dirname(fullPath);
    const newFullPath = this.validatePath(path.join(path.relative(this.rootPath, dirPath), newName));

    try {
      await fs.rename(fullPath, newFullPath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('File or directory not found');
      }
      throw error;
    }
  }

  async uploadFile(file: Express.Multer.File, userPath: string): Promise<void> {
    const targetDir = this.validatePath(userPath);
    let fileName = file.originalname;
    let filePath = path.join(targetDir, fileName);

    // Handle duplicate names
    let counter = 1;
    const ext = path.extname(fileName);
    const name = path.basename(fileName, ext);

    while (existsSync(filePath)) {
      fileName = `${name} (${counter})${ext}`;
      filePath = path.join(targetDir, fileName);
      counter++;
    }

    await fs.writeFile(filePath, file.buffer);
  }
}
