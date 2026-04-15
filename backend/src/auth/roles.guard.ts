import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // no roles required
    }
    const { user } = context.switchToHttp().getRequest();
    // user comes from JwtAuthGuard
    if (!user || !user.role) return false;

    // SUPER_ADMIN skips any role checks inherently if needed, but let's be explicit
    if (user.role === Role.SUPER_ADMIN) return true;

    return requiredRoles.includes(user.role);
  }
}
