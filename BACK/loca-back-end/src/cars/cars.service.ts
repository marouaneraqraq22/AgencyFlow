import { Injectable, NotFoundException,ConflictException ,InternalServerErrorException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from './entities/car.entity';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
  ) {}

  // Récupérer toutes les voitures
  async findAll(): Promise<Car[]> {
    return await this.carRepository.find();
  }

  // Ajouter une nouvelle voiture
  async create(createCarDto: Partial<Car>) {
  try {
    const newCar = this.carRepository.create(createCarDto);
    return await this.carRepository.save(newCar);
  } catch (error) {
    if (error.code === '23505') { // Code d'erreur pour "Unique Violation"
      throw new ConflictException('Cette plaque d\'immatriculation est déjà enregistrée.');
    }
    throw new InternalServerErrorException();
  }
}

  // Trouver une voiture par son ID
  async findOne(id: number): Promise<Car> {
    const car = await this.carRepository.findOne({ where: { id } });
    if (!car) {
      throw new NotFoundException(`La voiture avec l'ID ${id} n'existe pas.`);
    }
    return car;
  }

  // Mettre à jour une voiture
  // Mettre à jour une voiture avec gestion d'erreur
async update(id: number, updateData: Partial<Car>): Promise<Car> {
  try {
    const result = await this.carRepository.update(id, updateData);
    
    if (result.affected === 0) {
      throw new NotFoundException(`La voiture avec l'ID ${id} n'existe pas.`);
    }
    
    return this.findOne(id);
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictException('Cette plaque d\'immatriculation appartient déjà à un autre véhicule.');
    }
    // Si c'est déjà une NotFoundException, on la relance telle quelle
    if (error instanceof NotFoundException) throw error;
    
    throw new InternalServerErrorException("Erreur lors de la mise à jour");
  }
}

  // Supprimer une voiture
  async remove(id: number): Promise<void> {
    const result = await this.carRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Impossible de supprimer : ID ${id} introuvable.`);
    }
  }

  async updateStatus(id: number, status: string) {
    const car = await this.carRepository.findOne({ where: { id } });
    if (!car) throw new NotFoundException();
    
    car.status = status;
    return this.carRepository.save(car);
}
}