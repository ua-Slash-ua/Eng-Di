import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '../users/user.types';
import { hasAdminPanelAccess } from '../users/user.types';

@Injectable()
export class AdminPanelGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user || !hasAdminPanelAccess(user)) {
      throw new ForbiddenException('Немає доступу');
    }
    return true;
  }
}
