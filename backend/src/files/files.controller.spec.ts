import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { AuditService } from '../audit/audit.service';

describe('FilesController', () => {
  let controller: FilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: {
            listFiles: jest.fn(),
            getRecentFiles: jest.fn(),
            getTrashFiles: jest.fn(),
            downloadFile: jest.fn(),
            downloadMultipleFiles: jest.fn(),
            createDirectory: jest.fn(),
            restoreFile: jest.fn(),
            restoreMultipleFiles: jest.fn(),
            deleteFile: jest.fn(),
            renameFile: jest.fn(),
            uploadFile: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logFileAction: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
