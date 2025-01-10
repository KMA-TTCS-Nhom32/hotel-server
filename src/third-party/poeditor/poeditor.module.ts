import { Module } from '@nestjs/common';
import { PoeditorService } from './poeditor.service';
import { PoeditorController } from './poeditor.controller';

@Module({
  controllers: [PoeditorController],
  providers: [PoeditorService],
  exports: [PoeditorService],
})
export class PoeditorModule {}
