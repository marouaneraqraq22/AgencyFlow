import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn ,OneToMany} from 'typeorm';
import { Reservation } from 'src/reservations/entities/reservation.entity';
@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ unique: true })
  email: string;

  @Column()
  telephone: string;

  @Column({ unique: true })
  cin: string; // Carte d'Identité Nationale (Unique)

  @Column({ unique: true })
  permis: string; // Numéro de permis (Unique)

  @Column({ default: 'Actif' })
  statut: string; 
  @OneToMany(() => Reservation, (reservation) => reservation.client)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;
}