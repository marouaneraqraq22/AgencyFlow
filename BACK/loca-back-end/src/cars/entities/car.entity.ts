import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  brand: string;

  @Column()
  model: string; // ex: Logan, Clio

  @Column({ unique: true })
  licensePlate: string; // Matricule (doit être unique)

  @Column('decimal')
  pricePerDay: number;

  @Column({ default: 'Disponible' }) // available, rented, maintenance
  status: string;

  @Column({ nullable: true })
  imageUrl: string; // Pour afficher la photo en Vanilla JS
}