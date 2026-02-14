import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

 


// ... dans ta classe AuthService
async login(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (user) {
        
        // On utilise bcrypt.compare pour vérifier le mot de passe saisi avec celui haché
        const isMatch = await bcrypt.compare(pass, user.password);

        if (isMatch) {
            const payload = { sub: user.id, email: user.email, role: user.role };
            
            return {
                access_token: this.jwtService.sign(payload),
                user: {
                    id: user.id, // Ajoute l'id pour tes futurs besoins
                    nom: user.nom,
                    prenom: user.prenom,
                    role: user.role
                }
            };
        }
    }
    
    // Si l'utilisateur n'existe pas OU si le mot de passe ne match pas
    throw new UnauthorizedException('Identifiants incorrects');
}
}