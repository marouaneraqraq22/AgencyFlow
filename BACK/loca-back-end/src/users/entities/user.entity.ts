import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Ce sera un mot de passe haché (Bcrypt)

  @Column({ default: 'employee' }) // 'admin' ou 'employee'
  role: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;
}