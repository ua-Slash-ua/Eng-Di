import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';

@Catch(HttpException)
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const payload = exception.getResponse();
    const message =
      typeof payload === 'string'
        ? payload
        : Array.isArray((payload as { message?: unknown }).message)
          ? (payload as { message: string[] }).message[0]
          : String((payload as { message?: string }).message ?? exception.message);

    res.status(status).json({ error: message });
  }
}
