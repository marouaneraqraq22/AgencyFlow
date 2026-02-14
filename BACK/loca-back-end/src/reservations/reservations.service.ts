import { Injectable, NotFoundException, BadRequestException ,ForbiddenException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { Car } from '../cars/entities/car.entity';
import { Client } from '../clients/entities/client.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

async create(createResDto: any) {
    // 1. Récupérer la voiture pour avoir le VRAI prix par jour stocké en base
    const car = await this.carRepository.findOne({ where: { id: createResDto.carId } });
    if (!car) throw new NotFoundException('Voiture non trouvée');

    // 2. Vérifications de sécurité (Disponibilité et Client)
    if (car.status.toLowerCase() !== 'disponible') {
        throw new BadRequestException('Ce véhicule n\'est pas disponible');
    }

    const client = await this.clientRepository.findOne({ where: { id: createResDto.clientId } });
    if (!client) throw new NotFoundException('Client non trouvé');
    if (client.statut === 'bloqué') throw new ForbiddenException("Client sur liste noire");

    // 3. Validation des dates
    const start = new Date(createResDto.startDate);
    const end = new Date(createResDto.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Dates invalides');
    }

    // 4. CALCUL DU PRIX TOTAL (Sécurisé côté Backend)
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
        throw new BadRequestException('La durée minimale est de 1 jour');
    }

    // On multiplie les jours par le prix provenant DIRECTEMENT de la base de données
    const totalAPayer = diffDays * car.pricePerDay;

    // 5. Création de l'enregistrement avec le prix calculé ici
    const reservation = this.reservationRepository.create({
        startDate: start,
        endDate: end,
        totalPrice: totalAPayer, // On utilise notre variable sécurisée
        status: 'En cours',
        car: car,
        client: client
    });

    // 6. Mise à jour du statut voiture et sauvegarde
    car.status = 'Loué';
    await this.carRepository.save(car);
    
    return await this.reservationRepository.save(reservation);
}

  async findAll() {
    // On utilise "relations" pour récupérer les objets Car et Client complets
    return await this.reservationRepository.find({
      relations: ['car', 'client'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number) {
    const res = await this.reservationRepository.findOne({ 
      where: { id },
      relations: ['car', 'client'] 
    });
    if (!res) throw new NotFoundException(`Réservation #${id} introuvable`);
    return res;
  }

  async remove(id: number) {
    const res = await this.findOne(id);
    
    // Si on supprime, on peut rendre la voiture à nouveau disponible
    const car = res.car;
    car.status = 'Disponible';
    await this.carRepository.save(car);

    return await this.reservationRepository.delete(id);
  }
  async update(id: number, updateDto: any) {
    // 1. Récupérer la réservation avec sa relation 'car'
    const reservation = await this.reservationRepository.findOne({ 
        where: { id }, 
        relations: ['car'] 
    });

    // Vérifier si la réservation existe
    if (!reservation) {
        throw new NotFoundException(`La réservation avec l'ID ${id} n'existe pas.`);
    }

    // 2. Si on marque comme terminée, on libère la voiture
    if (updateDto.status === 'Terminée') {
        // On vérifie aussi que la voiture est bien attachée (sécurité supplémentaire)
        if (reservation.car) {
            await this.carRepository.update(reservation.car.id, { status: 'Disponible' });
        }
    }

    // 3. Appliquer la mise à jour
    return await this.reservationRepository.update(id, updateDto);
}
// Dans reservations.service.ts

async terminateByCar(carId: number) {
    // 1. On cherche la réservation active
    const reservation = await this.reservationRepository.findOne({
        where: { 
            car: { id: carId }, 
            status: 'En cours' 
        },
        relations: ['car']
    });

    // 2. Si rien n'est trouvé, on informe simplement le front (pas d'erreur 404 nécessaire ici)
    if (!reservation) {
        return { 
            success: true, 
            message: "Le véhicule a été mis en maintenance sans réservation à clôturer." 
        };
    }

    // 3. Mise à jour du statut
    reservation.status = 'Terminée';
    await this.reservationRepository.save(reservation);

    return { 
        success: true, 
        message: "Véhicule en maintenance et réservation clôturée." 
    };
}
}