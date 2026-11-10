import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { applyDatabaseUrl } from './config/database-url';
import { corsOrigins } from './config/cors-origins';

loadEnv({ override: true });
applyDatabaseUrl();

function cliArg(name: string): string | undefined {
  const eq = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(eq));
  if (hit) return hit.slice(eq.length);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('-')) {
    return process.argv[idx + 1];
  }
  return undefined;
}

async function bootstrap() {
  const { NestFactory } = await import('@nestjs/core');
  const { ValidationPipe } = await import('@nestjs/common');
  const { AppModule } = await import('./app.module');
  const { HttpErrorFilter } = await import('./http-error.filter');

  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const http = app.getHttpAdapter().getInstance() as {
    use: (path: string, handler: unknown) => void;
  };
  const express = await import('express');
  http.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.setGlobalPrefix('api');
  const expressApp = app.getHttpAdapter().getInstance() as { set: (key: string, value: unknown) => void };
  expressApp.set('trust proxy', 1);
  app.enableCors({
    origin: corsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpErrorFilter());

  // Hosting may pass --port= / --host=; else PORT / HOST from .env
  const port = Number(cliArg('port') ?? process.env.PORT ?? 4000);
  const host = cliArg('host') ?? process.env.HOST ?? '0.0.0.0';
  // Bind to specific host (not 0.0.0.0) so port 3000 does not clash with www/admin
  await app.listen(port, host);
  console.log(`MainApi listening on http://${host}:${port}`);
}

bootstrap();
