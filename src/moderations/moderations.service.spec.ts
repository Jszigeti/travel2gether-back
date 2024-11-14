import { Test, TestingModule } from '@nestjs/testing';
import { ModerationsService } from './moderations.service';

describe('ModerationsService', () => {
  let service: ModerationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModerationsService],
    }).compile();

    service = module.get<ModerationsService>(ModerationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
