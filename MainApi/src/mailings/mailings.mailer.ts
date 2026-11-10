import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import { SettingsService } from '../settings/settings.service';
import { DEFAULT_MAILING_TEMPLATES } from '../settings/mailing-settings';
import { MailingsService } from './mailings.service';
import { parseMailError, stringifyMailError } from './parse-mail-error';
import { personVars, type MailPerson } from './mail-vars';
import { MAILING_TYPE_LABELS, type MailingLogStatus, type MailingType } from './mailing.types';

type MailVars = Record<string, string>;

const RAW_MAIL_VARS = new Set(['reset_button']);

export type MailingSendResult = {
  status: MailingLogStatus;
  errorRaw: string | null;
  errorParsed: string | null;
  logId: number | null;
};

@Injectable()
export class MailingsMailerService {
  private readonly logger = new Logger(MailingsMailerService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly settings: SettingsService,
    private readonly mailings: MailingsService,
  ) {}

  loginUrl() {
    return `${this.panelBase()}/login`;
  }

  async sendWelcome(user: {
    id: number;
    email: string;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    middleName?: string | null;
    password: string;
  }): Promise<MailingSendResult> {
    return this.sendTemplate('welcome_registration', {
      email: user.email,
      userId: user.id,
      vars: {
        name: user.name,
        first_name: user.firstName?.trim() || user.name.trim().split(/\s+/)[0] || '',
        last_name: user.lastName?.trim() || '',
        middle_name: user.middleName?.trim() || '',
        email: user.email,
        password: user.password,
        login_url: this.loginUrl(),
      },
    });
  }

  async sendPasswordReset(user: {
    id: number;
    email: string;
    name: string;
    firstName?: string | null;
    resetLink: string;
  }): Promise<MailingSendResult> {
    const contacts = await this.settings.getContactsSettings();
    return this.sendTemplate('password_reset', {
      email: user.email,
      userId: user.id,
      vars: {
        name: user.name,
        first_name: user.firstName?.trim() || user.name.trim().split(/\s+/)[0] || '',
        email: user.email,
        reset_link: user.resetLink,
        reset_button: resetButtonHtml(user.resetLink),
        expires_in_minutes: '30',
        support_email: contacts.email || '',
      },
    });
  }

  cabinetUrl(role: 'student' | 'teacher') {
    return `${this.panelBase()}/cabinet/${role}/lessons`;
  }

  async sendToUser(
    type: MailingType,
    user: MailPerson | null | undefined,
    extra: MailVars = {},
  ): Promise<MailingSendResult | null> {
    if (!user?.email) return null;
    return this.sendTemplate(type, {
      email: user.email,
      userId: user.id,
      vars: {
        ...personVars(user),
        login_url: this.loginUrl(),
        ...extra,
      },
    });
  }

  async sendTemplate(
    type: MailingType,
    payload: { email: string; userId?: number | null; vars: MailVars },
  ): Promise<MailingSendResult> {
    const mailings = await this.settings.getMailingSettings();
    if (!this.settings.isMailingEnabled(mailings, type)) {
      this.logger.warn(`${MAILING_TYPE_LABELS[type]} is disabled. Skip ${payload.email}`);
      return this.finish({
        type,
        email: payload.email,
        userId: payload.userId,
        status: 'skipped',
        errorRaw: JSON.stringify({ code: 'MAILING_DISABLED', mailing: type }, null, 2),
        errorParsed: 'Розсилку вимкнено в налаштуваннях модуля',
      });
    }

    const template = mailings.templates[type] ?? DEFAULT_MAILING_TEMPLATES[type];
    const subject = stripTags(applyVars(template.subject, payload.vars, false));
    const htmlBody = applyVars(template.body, payload.vars, true);
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f1f47">${htmlBody}</div>`;
    const text = htmlToText(applyVars(template.body, payload.vars, false));

    const smtp = this.smtpConfig();
    if (smtp.disabled) {
      this.logger.warn(`SMTP disabled. ${MAILING_TYPE_LABELS[type]} for ${payload.email}`);
      return this.finish({
        type,
        email: payload.email,
        userId: payload.userId,
        status: 'skipped',
        errorRaw: JSON.stringify({ code: 'SMTP_DISABLED', SMTP_ENABLED: false }, null, 2),
        errorParsed: 'SMTP вимкнено в конфігурації сервера',
      });
    }

    if (!smtp.ready) {
      this.logger.error('SMTP is not configured.');
      return this.finish({
        type,
        email: payload.email,
        userId: payload.userId,
        status: 'failed',
        errorRaw: JSON.stringify(
          { code: 'SMTP_NOT_CONFIGURED', host: smtp.host || null, port: smtp.port || null, from: smtp.from || null },
          null,
          2,
        ),
        errorParsed: 'SMTP не налаштовано: немає хоста, порта або відправника',
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: smtp.auth,
      });
      const messageId = makeMessageId();
      const info = await transporter.sendMail({
        from: smtp.from,
        to: payload.email,
        subject,
        text,
        html,
        messageId,
      });
      return this.finish({
        type,
        email: payload.email,
        userId: payload.userId,
        status: 'sent',
        errorRaw: null,
        errorParsed: null,
        messageId: info.messageId || messageId,
      });
    } catch (error) {
      const errorRaw = stringifyMailError(error);
      const errorParsed = parseMailError(errorRaw, error);
      this.logger.error(`${MAILING_TYPE_LABELS[type]} failed for ${payload.email}: ${errorParsed}`);
      return this.finish({
        type,
        email: payload.email,
        userId: payload.userId,
        status: 'failed',
        errorRaw,
        errorParsed,
      });
    }
  }

  private async finish(data: {
    type: MailingType;
    email: string;
    userId?: number | null;
    status: MailingLogStatus;
    errorRaw: string | null;
    errorParsed: string | null;
    messageId?: string | null;
  }): Promise<MailingSendResult> {
    const row = await this.mailings.record({
      type: data.type,
      email: data.email,
      userId: data.userId,
      status: data.status,
      error: data.errorParsed,
      errorRaw: data.errorRaw,
      messageId: data.messageId,
    });
    return {
      status: data.status,
      errorRaw: data.errorRaw,
      errorParsed: data.errorParsed,
      logId: row.id,
    };
  }

  private panelBase() {
    const baseRaw =
      this.config.get<string>('RESET_PASSWORD_URL_BASE') ??
      (process.env.NODE_ENV === 'production' ? this.config.get<string>('USER_PANEL_ORIGIN') : undefined) ??
      'http://localhost:3000';
    return baseRaw.trim().replace(/\/+$/, '');
  }

  private smtpConfig() {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const port = Number(this.config.get<string>('SMTP_PORT') ?? '0');
    const user = this.config.get<string>('SMTP_USERNAME')?.trim();
    const pass = this.config.get<string>('SMTP_PASSWORD');
    const from = this.config.get<string>('SMTP_FROM')?.trim() || user;
    const enabled = this.config.get<string>('SMTP_ENABLED');
    const secure = this.config.get<string>('SMTP_SECURE');
    return {
      disabled: enabled === 'false',
      ready: Boolean(host && port && from),
      host,
      port,
      from,
      secure: secure ? secure === 'true' : port === 465,
      auth: user && pass ? { user, pass } : undefined,
    };
  }
}

function makeMessageId() {
  return `<engdi-${Date.now().toString(36)}-${randomBytes(6).toString('hex')}@eng-di.com>`;
}

function applyVars(input: string, vars: MailVars, escapeValues: boolean) {
  return input.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key: string) => {
    const value = vars[key] ?? '';
    if (escapeValues && !RAW_MAIL_VARS.has(key)) {
      return escapeHtml(value);
    }
    return value;
  });
}

function resetButtonHtml(link: string, label = 'Змінити пароль') {
  const safeLink = escapeHtml(link);
  const safeLabel = escapeHtml(label);
  return `<a href="${safeLink}" style="display:inline-block;margin:16px 0;padding:14px 28px;background:#c8f04d;color:#142018;text-decoration:none;font-weight:700;font-size:16px;line-height:1.2;border-radius:8px;box-shadow:0 3px 0 #10211b;">${safeLabel}</a>`;
}

function stripTags(input: string) {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(value: string) {
  return value.replace(/[<>&"]/g, (char) => {
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    if (char === '&') return '&amp;';
    return '&quot;';
  });
}
