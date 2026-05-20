import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErController } from './er.controller';
import { ErService } from './er.service';
import { ErCase } from './er-case.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ErCase])],
  controllers: [ErController],
  providers: [ErService],
})
export class ErModule {}
