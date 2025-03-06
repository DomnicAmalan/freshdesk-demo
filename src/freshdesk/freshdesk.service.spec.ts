import { Test, TestingModule } from '@nestjs/testing';
import { FreshdeskService } from './freshdesk.service';

describe('FreshdeskService', () => {
  let service: FreshdeskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FreshdeskService],
    }).compile();

    service = module.get<FreshdeskService>(FreshdeskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
