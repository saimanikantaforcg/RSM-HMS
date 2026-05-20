import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Encounter } from '../entities/encounter.entity';
import { EncountersService } from './encounters.service';
import { EncountersController } from './encounters.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Encounter])],
  controllers: [EncountersController],
  providers: [EncountersService],
  exports: [EncountersService],
})
export class EncountersModule { }
