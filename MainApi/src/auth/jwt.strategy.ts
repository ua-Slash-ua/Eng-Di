import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import type { Request } from 'express';

import { UsersService } from '../users/users.service';

import type { AuthUser } from '../users/user.types';

import {

  LEGACY_ACCESS_COOKIE,

  accessCookieName,

  readCookie,

} from './cookies';

import type { AccessPayload } from './access-payload';

import { getRequestPanel } from './request-context';

import { SessionsService } from './sessions.service';



@Injectable()

export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(

    config: ConfigService,

    private readonly users: UsersService,

    private readonly sessions: SessionsService,

  ) {

    super({

      jwtFromRequest: ExtractJwt.fromExtractors([

        (req: Request) => {

          const panel = getRequestPanel(req);

          return (

            readCookie(req, accessCookieName(panel)) ??

            readCookie(req, LEGACY_ACCESS_COOKIE) ??

            null

          );

        },

        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ]),

      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),

      passReqToCallback: true,

    });

  }



  async validate(req: Request, payload: AccessPayload): Promise<AuthUser> {

    if (payload.typ !== 'access' || !payload.userId || !payload.sid) {

      throw new UnauthorizedException('Потрібна авторизація');

    }

    const panel = getRequestPanel(req);

    const session = await this.sessions.assertActive(payload.sid);

    if (!session || session.userId !== payload.userId || session.panel !== panel) {

      throw new UnauthorizedException('Потрібна авторизація');

    }

    const user = await this.users.findById(payload.userId);

    if (!user || user.status === 'blocked') {

      throw new UnauthorizedException('Потрібна авторизація');

    }

    await this.sessions.touch(session.id);

    return { ...this.users.toPublic(user), sessionId: session.id };

  }

}

