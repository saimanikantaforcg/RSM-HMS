import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbdmController } from './abdm.controller';
import { AbdmService } from './abdm.service';
import { AbhaProfile } from '../entities/abha-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AbhaProfile])],
  controllers: [AbdmController],
  providers: [AbdmService],
})
export class AbdmModule {}
