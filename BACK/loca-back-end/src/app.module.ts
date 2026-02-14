 import { Module } from '@nestjs/common';//BACK\loca-back-end
 import { TypeOrmModule } from '@nestjs/typeorm'; // Si tu utilises une DB
 import { AuthModule } from './auth/auth.module';
 import { UsersModule } from './users/users.module';
 import { CarsModule } from './cars/cars.module';
import { ClientsModule } from './clients/clients.module';
import { ReservationsModule } from './reservations/reservations.module';

 @Module({
   imports: [
     // Configuration de la base de données (PostgreSQL par exemple)
     TypeOrmModule.forRoot({
       type: 'postgres',
       host: 'localhost',
       port: 5432,
       username: 'postgres',
       password: '0000',
       database: 'Location',
      autoLoadEntities: true,
      synchronize: true, // Désactiver en production !
    }),
    AuthModule,
    UsersModule,
    CarsModule,
    ClientsModule,
    ReservationsModule,
  ],
 })
export class AppModule {}