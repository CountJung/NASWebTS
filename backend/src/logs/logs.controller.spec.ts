import { Test, TestingModule } from '@nestjs/testing';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

describe('LogsController', () => {
  let controller: LogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogsController],
      providers: [
        {
          provide: LogsService,
          useValue: {
            logFrontendError: jest.fn(),
            logFrontendInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LogsController>(LogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
