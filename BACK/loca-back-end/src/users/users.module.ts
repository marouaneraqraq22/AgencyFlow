import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- Ajoute cet import
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity'; // <-- Importe ton entité

@Module({
  // Ajoute le bloc imports ici !
  imports: [TypeOrmModule.forFeature([User])], 
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}