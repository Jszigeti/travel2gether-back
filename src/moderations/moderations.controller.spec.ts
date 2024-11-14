import { Test, TestingModule } from '@nestjs/testing';
import { ModerationsController } from './moderations.controller';
import { ModerationsService } from './moderations.service';

describe('ModerationsController', () => {
  let controller: ModerationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModerationsController],
      providers: [ModerationsService],
    }).compile();

    controller = module.get<ModerationsController>(ModerationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
