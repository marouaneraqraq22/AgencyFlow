import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Récupérer les rôles définis par @Roles() sur la route
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si aucune restriction de rôle n'est définie, on laisse passer
    if (!requiredRoles) {
      return true;
    }

    // 2. Récupérer l'utilisateur injecté par le JwtAuthGuard
    const { user } = context.switchToHttp().getRequest();

    // 3. Vérifier si l'utilisateur possède l'un des rôles requis
    const hasRole = requiredRoles.some((role) => user.role?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException("Accès interdit : vous n'avez pas les droits nécessaires");
    }

    return hasRole;
  }
}