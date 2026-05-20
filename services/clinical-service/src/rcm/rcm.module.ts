import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RcmController } from './rcm.controller';
import { RcmService } from './rcm.service';
import { RcmEntry } from '../entities/rcm-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RcmEntry])],
  controllers: [RcmController],
  providers: [RcmService],
})
export class RcmModule {}
