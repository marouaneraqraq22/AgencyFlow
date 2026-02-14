import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from './entities/reservation.entity';
import { Car } from '../cars/entities/car.entity'; // Import de l'entité Car
import { Client } from '../clients/entities/client.entity'; // Import de l'entité Client

@Module({
  imports: [
    // On enregistre les entités nécessaires pour ce module
    TypeOrmModule.forFeature([Reservation, Car, Client])
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}