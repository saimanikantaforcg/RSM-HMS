import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhysiciansController } from './physicians.controller';
import { PhysiciansService } from './physicians.service';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [PhysiciansController],
  providers: [PhysiciansService],
})
export class PhysiciansModule {}
