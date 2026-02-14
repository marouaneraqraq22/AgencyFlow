import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from '../auth/decorators/role.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // Protège toutes les routes du contrôleur
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin') // Seul Sofia (admin) peut voir la liste
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @Roles('admin') // Seul un admin peut créer un compte employé
  create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}