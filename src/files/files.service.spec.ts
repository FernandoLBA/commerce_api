import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { CloudinaryService } from '../common';

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: CloudinaryService,
          useValue: {
            uploadFromBuffer: jest.fn(),
            getResponsiveUrls: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
