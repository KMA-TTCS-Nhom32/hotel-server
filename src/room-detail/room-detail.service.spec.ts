import { Test, TestingModule } from '@nestjs/testing';
import { RoomDetailService } from './room-detail.service';

describe('RoomDetailService', () => {
  let service: RoomDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomDetailService],
    }).compile();

    service = module.get<RoomDetailService>(RoomDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
