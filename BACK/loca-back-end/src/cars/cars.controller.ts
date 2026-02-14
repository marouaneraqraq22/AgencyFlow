import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards,Patch ,ParseIntPipe} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CarsService } from './cars.service';

@Controller('cars')
@UseGuards(AuthGuard('jwt'))
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  // 1. Lister toutes les voitures (Public ou Employés)
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll() {
    return this.carsService.findAll();
  }

  // 2. Ajouter une voiture (Protégé par JWT)
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() carData: any) {
    return this.carsService.create(carData);
  }

  // 3. Supprimer une voiture (Protégé par JWT)
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.carsService.remove(+id);
  }

  // 4. Mettre à jour (Changer le prix ou le statut)
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
async update(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.carsService.update(id, updateData);
}
@UseGuards(AuthGuard('jwt'))
@Patch(':id/status')
async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.carsService.updateStatus(+id, status);
}
}