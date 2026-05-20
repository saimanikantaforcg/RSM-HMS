import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtController } from './ot.controller';
import { OtService } from './ot.service';
import { SurgeryBlock } from '../entities/surgery-block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SurgeryBlock])],
  controllers: [OtController],
  providers: [OtService],
})
export class OtModule {}
