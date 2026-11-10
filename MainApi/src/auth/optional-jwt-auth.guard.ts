import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | undefined, user: TUser): TUser | null {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
