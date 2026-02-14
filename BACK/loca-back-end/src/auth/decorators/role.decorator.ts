import { SetMetadata } from '@nestjs/common';

// Ce décorateur permet d'écrire @Roles('admin') au-dessus des contrôleurs
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);