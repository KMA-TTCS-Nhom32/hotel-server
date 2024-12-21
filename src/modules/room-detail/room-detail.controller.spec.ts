import { Test, TestingModule } from '@nestjs/testing';
import { RoomDetailController } from './room-detail.controller';
import { RoomDetailService } from './room-detail.service';

describe('RoomDetailController', () => {
  let controller: RoomDetailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomDetailController],
      providers: [RoomDetailService],
    }).compile();

    controller = module.get<RoomDetailController>(RoomDetailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
