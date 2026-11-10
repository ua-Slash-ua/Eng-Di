import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { AuthUser } from '../users/user.types';
import { hasUserPanelAccess } from '../users/user.types';

@Injectable()
export class UserPanelGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user || !hasUserPanelAccess(user)) {
      throw new ForbiddenException('Немає доступу до кабінету');
    }
    return true;
  }
}
