import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BedsController } from './beds.controller';
import { BedsService } from './beds.service';
import { Bed } from '../entities/bed.entity';
import { Ward } from '../entities/ward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bed, Ward])],
  controllers: [BedsController],
  providers: [BedsService],
})
export class BedsModule {}
