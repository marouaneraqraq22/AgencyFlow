import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt'; 

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOneById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // --- CRÉATION AVEC HACHAGE ---
  async create(userData: Partial<User>): Promise<User> {
    if (userData.password) {
      const salt = await bcrypt.genSalt();
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    const newUser = this.userRepository.create(userData);
    return this.userRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
  // .find() renvoie TOUJOURS un tableau [ ], même s'il est vide.
  return await this.userRepository.find({
    select: ['id', 'nom', 'prenom', 'email', 'role'], 
  });
}

  // --- MISE À JOUR ---
  async update(id: number, updateUserDto: Partial<User>): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) throw new NotFoundException(`L'employé avec l'id ${id} n'existe pas`);
    
    // Si on change le mot de passe, on le re-hache
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  // --- SUPPRESSION ---
  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Impossible de supprimer : l'employé ${id} est introuvable`);
    }
  }
}