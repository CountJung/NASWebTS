import { Injectable, BadRequestException, NotFoundException, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, existsSync, statSync } from 'fs';
import archiver from 'archiver';

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
  private readonly trashPath: string;

  constructor(private readonly configService: ConfigService) {
    this.rootPath = path.resolve(this.configService.get<string>('ROOT_PATH') || './nas-storage');
    this.trashPath = path.join(this.rootPath, '.trash');
    this.ensureRootPathExists();
    this.ensureTrashPathExists();
  }

  private async ensureRootPathExists() {
    try {
      await fs.access(this.rootPath);
    } catch {
      await fs.mkdir(this.rootPath, { recursive: true });
    }
  }

  private async ensureTrashPathExists() {
    try {
      await fs.access(this.trashPath);
    } catch {
      await fs.mkdir(this.trashPath, { recursive: true });
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

      const files = await Promise.all(
        dirContent.map(async (dirent) => {
          // Skip .trash folder from normal listing
          if (fullPath === this.rootPath && dirent.name === '.trash') return null;

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

  async getTrashFiles(): Promise<FileInfo[]> {
    try {
      const dirContent = await fs.readdir(this.trashPath, { withFileTypes: true });
      const files = await Promise.all(
        dirContent.map(async (dirent) => {
          // Skip metadata files
          if (dirent.name.endsWith('.meta')) return null;

          const filePath = path.join(this.trashPath, dirent.name);
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
            return null;
          }
        }),
      );
      return files.filter((f) => f !== null) as FileInfo[];
    } catch (error) {
      return [];
    }
  }

  async restoreFile(fileName: string): Promise<void> {
    const trashFilePath = path.join(this.trashPath, fileName);
    const metaFilePath = `${trashFilePath}.meta`;

    if (!existsSync(trashFilePath)) {
      throw new NotFoundException('File not found in trash');
    }

    let originalPath = '';
    if (existsSync(metaFilePath)) {
      try {
        const metaContent = await fs.readFile(metaFilePath, 'utf-8');
        const meta = JSON.parse(metaContent);
        originalPath = meta.originalPath;
      } catch (e) {
        // If meta file is corrupted or missing, restore to root
        originalPath = fileName;
      }
    } else {
      // If no meta file, restore to root
      originalPath = fileName;
    }

    // Ensure original directory exists
    const targetFullPath = path.join(this.rootPath, originalPath);
    const targetDir = path.dirname(targetFullPath);
    
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (e) {
      // Ignore if dir exists
    }

    // Handle duplicate names at target
    let finalPath = targetFullPath;
    let counter = 1;
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    const dir = path.dirname(targetFullPath);

    while (existsSync(finalPath)) {
      finalPath = path.join(dir, `${name} (${counter})${ext}`);
      counter++;
    }

    await fs.rename(trashFilePath, finalPath);
    
    // Delete meta file if exists
    if (existsSync(metaFilePath)) {
      await fs.unlink(metaFilePath);
    }
  }

  async restoreMultipleFiles(fileNames: string[]): Promise<void> {
    for (const fileName of fileNames) {
      try {
        await this.restoreFile(fileName);
      } catch (error) {
        console.error(`Failed to restore file ${fileName}:`, error);
        // Continue restoring other files even if one fails
      }
    }
  }

  async deleteFile(userPath: string): Promise<void> {
    const fullPath = this.validatePath(userPath);

    // Check if we are deleting from trash
    if (fullPath.startsWith(this.trashPath)) {
      // Permanently delete
      try {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
          await fs.rm(fullPath, { recursive: true, force: true });
        } else {
          await fs.unlink(fullPath);
        }
        
        // Delete meta file if exists
        const metaFilePath = `${fullPath}.meta`;
        if (existsSync(metaFilePath)) {
          await fs.unlink(metaFilePath);
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          throw new NotFoundException('File or directory not found');
        }
        throw error;
      }
    } else {
      // Move to trash
      const fileName = path.basename(fullPath);
      let trashFilePath = path.join(this.trashPath, fileName);
      
      // Handle duplicate names in trash
      let counter = 1;
      const ext = path.extname(fileName);
      const name = path.basename(fileName, ext);

      while (existsSync(trashFilePath)) {
        trashFilePath = path.join(this.trashPath, `${name} (${counter})${ext}`);
        counter++;
      }

      try {
        await fs.rename(fullPath, trashFilePath);
        
        // Create metadata file
        const relativePath = path.relative(this.rootPath, fullPath);
        const metaFilePath = `${trashFilePath}.meta`;
        await fs.writeFile(metaFilePath, JSON.stringify({ originalPath: relativePath }));
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          throw new NotFoundException('File or directory not found');
        }
        throw error;
      }
    }
  }
  async getRecentFiles(): Promise<FileInfo[]> {
    const allFiles: FileInfo[] = [];
    
    const traverse = async (currentPath: string) => {
      const dirContent = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const dirent of dirContent) {
        if (dirent.name === '.trash') continue;
        
        const filePath = path.join(currentPath, dirent.name);
        try {
          const stats = await fs.stat(filePath);
          if (dirent.isDirectory()) {
            await traverse(filePath);
          } else {
            allFiles.push({
              name: dirent.name,
              type: 'file',
              size: stats.size,
              createdAt: stats.birthtime,
              updatedAt: stats.mtime,
            });
          }
        } catch (e) {
          // ignore inaccessible files
        }
      }
    };

    await traverse(this.rootPath);

    // Sort by updatedAt desc and take top 20
    return allFiles
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 20);
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

  async downloadMultipleFiles(userPaths: string[]): Promise<{ stream: archiver.Archiver; fileName: string }> {
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archiver warning:', err);
      } else {
        console.error('Archiver error:', err);
      }
    });

    for (const userPath of userPaths) {
      try {
        const fullPath = this.validatePath(userPath);
        if (!existsSync(fullPath)) {
          console.warn(`File not found for download: ${fullPath}`);
          continue;
        }

        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
          console.log(`Adding directory to archive: ${fullPath}`);
          archive.directory(fullPath, path.basename(fullPath));
        } else {
          console.log(`Adding file to archive: ${fullPath}`);
          archive.file(fullPath, { name: path.basename(fullPath) });
        }
      } catch (error) {
        console.error(`Error processing path ${userPath}:`, error);
      }
    }

    archive.finalize();

    return {
      stream: archive,
      fileName: `download_${new Date().getTime()}.zip`,
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
    // Fix for Korean characters in filename (Multer encoding issue)
    let fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
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
