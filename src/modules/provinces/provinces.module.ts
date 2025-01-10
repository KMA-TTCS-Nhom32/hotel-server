import { Module } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { ProvincesController } from './provinces.controller';
import { DatabaseModule } from '@/database/database.module';
import { PoeditorModule } from '@/third-party/poeditor/poeditor.module';

@Module({
  imports: [DatabaseModule, PoeditorModule],
  controllers: [ProvincesController],
  providers: [ProvincesService],
})
export class ProvincesModule {}
