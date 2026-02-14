import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 1. On extrait le token du header "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      
      secretOrKey: 'awxcvdqsdfmazeriuiopnjklm', 
    });
  }

  // Cette méthode injecte l'utilisateur décodé dans l'objet "request"
  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}