import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelemedController } from './telemed.controller';
import { TelemedService } from './telemed.service';
import { Encounter } from '../entities/encounter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Encounter])],
  controllers: [TelemedController],
  providers: [TelemedService],
})
export class TelemedModule {}
