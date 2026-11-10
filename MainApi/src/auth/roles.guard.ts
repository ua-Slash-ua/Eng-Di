import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '../users/user.types';
import { SUPER_ADMIN_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const superAdminOnly = this.reflector.getAllAndOverride<boolean>(SUPER_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!superAdminOnly) {
      return true;
    }
    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user?.isSuperAdmin) {
      throw new ForbiddenException('Немає доступу');
    }
    return true;
  }
}
