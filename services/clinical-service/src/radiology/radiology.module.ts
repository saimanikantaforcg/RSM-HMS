import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RadiologyController } from './radiology.controller';
import { RadiologyService } from './radiology.service';
import { RadiologyReport } from './radiology-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RadiologyReport])],
  controllers: [RadiologyController],
  providers: [RadiologyService],
})
export class RadiologyModule {}
