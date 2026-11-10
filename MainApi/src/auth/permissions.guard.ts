import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '../users/user.types';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }

    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user) {
      throw new ForbiddenException('Немає доступу');
    }
    if (user.isSuperAdmin) {
      return true;
    }

    const granted = new Set(user.permissions);
    const ok = required.some((key) => granted.has(key));
    if (!ok) {
      throw new ForbiddenException('Немає доступу');
    }
    return true;
  }
}
