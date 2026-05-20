import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { StaffRoster } from '../entities/staff-roster.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StaffRoster])],
  controllers: [SchedulingController],
  providers: [SchedulingService],
})
export class SchedulingModule {}
