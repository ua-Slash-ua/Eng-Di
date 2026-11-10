import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ImapFlow } from 'imapflow';
import { bounceErrorPayload, parseBounce } from './parse-bounce';
import { parseMailError } from './parse-mail-error';
import { MailingsService } from './mailings.service';

@Injectable()
export class BounceMailJob implements OnModuleInit {
  private readonly logger = new Logger(BounceMailJob.name);
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly mailings: MailingsService,
  ) {}

  onModuleInit() {
    setTimeout(() => {
      void this.tick();
    }, 8000);
  }

  @Cron('*/2 * * * *')
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const updated = await this.collectBounces();
      if (updated) {
        this.logger.warn(`Оновлено ${updated} записів журналу після bounce`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(`Перевірка bounce не вдалась: ${message}`);
    } finally {
      this.running = false;
    }
  }

  private async collectBounces() {
    const imap = this.imapConfig();
    if (!imap) return 0;

    const client = new ImapFlow({
      host: imap.host,
      port: imap.port,
      secure: true,
      auth: { user: imap.user, pass: imap.pass },
      logger: false,
    });

    let lock: { release(): void } | undefined;
    try {
      await client.connect();
      lock = await client.getMailboxLock('INBOX');
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const uids = unique([
        ...asUids(await client.search({ from: 'mailer-daemon', since }, { uid: true })),
        ...asUids(await client.search({ from: 'mailer-daemon@googlemail.com', since }, { uid: true })),
        ...asUids(await client.search({ subject: 'Delivery Status Notification', since }, { uid: true })),
      ]).slice(-80);
      if (!uids.length) return 0;

      let updated = 0;
      for await (const message of client.fetch(uids, { source: true, envelope: true }, { uid: true })) {
        const raw = bufferText(message.source);
        const bounce = parseBounce(raw, imap.user);
        if (!bounce?.permanent) continue;
        const errorRaw = JSON.stringify(bounceErrorPayload(bounce), null, 2);
        const errorParsed = `Лист повернуто після відправки (bounce). ${parseMailError(errorRaw)}`;
        updated += await this.mailings.markBounced({
          emails: bounce.emails,
          messageIds: bounce.messageIds,
          error: errorParsed,
          errorRaw,
        });
      }
      return updated;
    } finally {
      lock?.release();
      await client.logout().catch(() => undefined);
    }
  }

  private imapConfig() {
    const enabled = this.config.get<string>('IMAP_ENABLED');
    if (enabled === 'false') return null;
    const smtpEnabled = this.config.get<string>('SMTP_ENABLED');
    if (smtpEnabled === 'false') return null;
    const user =
      this.config.get<string>('IMAP_USERNAME')?.trim() || this.config.get<string>('SMTP_USERNAME')?.trim();
    const pass = this.config.get<string>('IMAP_PASSWORD') || this.config.get<string>('SMTP_PASSWORD');
    const host = this.config.get<string>('IMAP_HOST')?.trim() || defaultImapHost(this.config.get<string>('SMTP_HOST'));
    const port = Number(this.config.get<string>('IMAP_PORT') ?? '993');
    if (!user || !pass || !host) return null;
    return { host, port, user, pass };
  }
}

function defaultImapHost(smtpHost?: string) {
  if (!smtpHost?.trim()) return 'imap.gmail.com';
  if (/smtp\.gmail\.com/i.test(smtpHost)) return 'imap.gmail.com';
  return smtpHost.replace(/^smtp\./i, 'imap.');
}

function asUids(value: number[] | false | undefined) {
  return Array.isArray(value) ? value : [];
}

function unique(items: number[]) {
  return [...new Set(items)];
}

function bufferText(source: Buffer | Uint8Array | undefined) {
  if (!source) return '';
  return Buffer.from(source).toString('utf8');
}
