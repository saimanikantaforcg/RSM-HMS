import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsReport } from '../entities/analytics-report.entity';
import { Stock } from '../entities/stock.entity';
import { Admission } from '../entities/admission.entity';
import { ErCase } from '../er/er-case.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsReport, Stock, Admission, ErCase])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
