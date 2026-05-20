import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdtController } from './adt.controller';
import { AdtService } from './adt.service';
import { Admission } from '../entities/admission.entity';
import { Ward } from '../entities/ward.entity';
import { Bed } from '../entities/bed.entity';
import { AdtLog } from '../entities/adt-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admission, Ward, Bed, AdtLog])],
  controllers: [AdtController],
  providers: [AdtService],
  exports: [AdtService],
})
export class AdtModule {}
