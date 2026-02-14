import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK) //Forcer le code succes Ok 200 :  non created 201
  @Post('login') // Route finale : http://localhost:3000/auth/login
  async login(@Body() loginDto: any) {
    // On appelle la méthode login du service que nous avons créé tout à l'heure
    return this.authService.login(loginDto.email, loginDto.password);
  }
}