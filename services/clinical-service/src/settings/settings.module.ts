import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { HospitalSettings } from '../entities/hospital-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HospitalSettings])],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
