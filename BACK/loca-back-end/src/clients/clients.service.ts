import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}
  async create(clientData: Partial<Client>): Promise<Client> {
    try {
      const newClient = this.clientRepository.create(clientData);
      return await this.clientRepository.save(newClient);
    } catch (error) {
      // Code 23505 = Clé dupliquée dans PostgreSQL
      if (error.code === '23505') {
        throw new ConflictException('Le CIN ou le numéro de permis existe déjà dans la base.');
      }
      throw new InternalServerErrorException("Erreur lors de la création du client");
    }
  }

 async findAll(): Promise<Client[]> {
    return await this.clientRepository.find({
      order: { createdAt: 'DESC' }, // Les plus récents en premier
    });
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Le client avec l'ID ${id} n'existe pas.`);
    }
    return client;
  }

  async update(id: number, updateData: Partial<Client>): Promise<Client> {
    try {
      const result = await this.clientRepository.update(id, updateData);
      if (result.affected === 0) {
        throw new NotFoundException(`Client ${id} introuvable.`);
      }
      return this.findOne(id);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Mise à jour impossible : CIN ou Permis déjà utilisé.');
      }
      throw new InternalServerErrorException();
    }
  }

  async remove(id: number): Promise<void> {
    // 1. On cherche le client ET ses réservations liées
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['reservations'], // Vérifie que le nom de la relation dans ton entité est bien 'reservations'
    });

    // 2. Si le client n'existe pas, on lance une 404
    if (!client) {
      throw new NotFoundException(`Impossible de supprimer : ID ${id} introuvable.`);
    }

    // 3. Si le client a des réservations, on bloque la suppression (Option 3)
    // Cela évite l'erreur de clé étrangère (FK) dans PostgreSQL
    if (client.reservations && client.reservations.length > 0) {
      throw new ConflictException(
        `Suppression impossible : Le client ${client.prenom} ${client.nom} est lié à ${client.reservations.length} réservation(s).`
      );
    }

    // 4. Si tout est OK, on procède à la suppression réelle
    await this.clientRepository.delete(id);
}
}
