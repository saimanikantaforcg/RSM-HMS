import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IpdController } from './ipd.controller';
import { IpdService } from './ipd.service';
import { Encounter } from '../entities/encounter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Encounter])],
  controllers: [IpdController],
  providers: [IpdService],
})
export class IpdModule {}
