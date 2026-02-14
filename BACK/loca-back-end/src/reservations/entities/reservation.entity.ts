import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Car } from '../../cars/entities/car.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ default: 'En cours' })
  status: string;

  @ManyToOne(() => Client, (client) => client.reservations, { eager: true })
  client: Client;

  @ManyToOne(() => Car, { eager: true })
  car: Car;

  @CreateDateColumn()
  createdAt: Date;
}