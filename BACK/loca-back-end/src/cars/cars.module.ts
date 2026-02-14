import { Module } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Car } from './entities/car.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Car])],
  providers: [CarsService],
  controllers: [CarsController],
  exports:[CarsService]
})
export class CarsModule {}
