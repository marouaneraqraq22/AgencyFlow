import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Cette méthode gère les erreurs d'authentification
  handleRequest(err, user, info) {
    // Si une erreur survient ou si l'utilisateur n'existe pas (token invalide)
    if (err || !user) {
      throw err || new UnauthorizedException("Session expirée ou token invalide");
    }
    return user;
  }
}