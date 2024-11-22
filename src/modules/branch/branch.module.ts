import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { DatabaseService } from '@/database/database.service';

@Module({
  imports: [DatabaseService],
  controllers: [BranchController],
  providers: [BranchService],
})
export class BranchModule {}
