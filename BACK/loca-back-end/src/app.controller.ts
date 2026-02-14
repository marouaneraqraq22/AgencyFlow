import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('cars')
export class CarsController {
  
  @UseGuards(AuthGuard('jwt')) // Verrouille TOUTES les routes de ce contrôleur
  @Get()
  findAll() {
    return "Cette liste n'est visible que si tu as un Token !";
  }
}