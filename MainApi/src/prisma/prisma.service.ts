import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import { applyDatabaseUrl } from '../config/database-url';
import { runStartup } from '../database/startup/runStartup';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly config: ConfigService) {
    loadEnv({ override: true });
    applyDatabaseUrl();
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    await runStartup(this, this.config);
  }
}
