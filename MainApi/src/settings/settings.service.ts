import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  BRANDING_SETTING_KEY,
  DEFAULT_BRANDING_SETTINGS,
  FAVICON_ACCEPT,
  FAVICON_MAX_MB,
  LOGO_ACCEPT,
  LOGO_MAX_MB,
  brandingMaxBytes,
  brandingMimes,
  normalizeBrandingSettings,
  type BrandingSettings,
} from './branding-settings';
import {
  CONTACTS_SETTING_KEY,
  DEFAULT_CONTACTS_SETTINGS,
  normalizeContactsSettings,
  phoneHref,
  type ContactsSettings,
} from './contact-settings';
import type { UpdateContactsSettingsDto } from './dto/update-contacts-settings.dto';
import {
  DEFAULT_MEDIA_SETTINGS,
  IMAGE_FORMAT_OPTIONS,
  MEDIA_SETTING_KEY,
  VIDEO_FORMAT_OPTIONS,
  acceptForFormats,
  normalizeMediaSettings,
  type MediaSettings,
} from './media-settings';
import type { UpdateMediaSettingsDto } from './dto/update-media-settings.dto';
import type { UpdateBrandingSettingsDto } from './dto/update-branding-settings.dto';
import type { UpdateMailingSettingsDto } from './dto/update-mailing-settings.dto';
import {
  DEFAULT_PRESENTATION_SETTINGS,
  PRESENTATION_FORMAT_OPTIONS,
  PRESENTATION_SETTING_KEY,
  presentationAcceptForFormats,
  normalizePresentationSettings,
  type PresentationSettings,
} from './presentation-settings';
import type { UpdatePresentationSettingsDto } from './dto/update-presentation-settings.dto';
import type { UpdateUiSettingsDto } from './dto/update-ui-settings.dto';
import type { MailingType } from '../mailings/mailing.types';
import {
  DEFAULT_MAILING_SETTINGS,
  MAILING_SETTING_KEY,
  normalizeMailingSettings,
  type MailingSettings,
} from './mailing-settings';
import {
  DEFAULT_UI_SETTINGS,
  UI_SETTING_KEY,
  normalizeUiSettings,
  type UiSettings,
} from './ui-settings';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMediaSettings(): Promise<MediaSettings> {
    const row = await this.prisma.setting.findUnique({ where: { key: MEDIA_SETTING_KEY } });
    return normalizeMediaSettings(row?.value ?? DEFAULT_MEDIA_SETTINGS);
  }

  async getMediaSettingsPayload() {
    const settings = await this.getMediaSettings();
    return {
      settings,
      imageFormatOptions: IMAGE_FORMAT_OPTIONS.map(({ id, label, mimes, extensions }) => ({
        id,
        label,
        mimes,
        extensions,
      })),
      videoFormatOptions: VIDEO_FORMAT_OPTIONS.map(({ id, label, mimes, extensions }) => ({
        id,
        label,
        mimes,
        extensions,
      })),
      imageAccept: acceptForFormats(IMAGE_FORMAT_OPTIONS, settings.imageFormats),
      videoAccept: acceptForFormats(VIDEO_FORMAT_OPTIONS, settings.videoFormats),
    };
  }

  async updateMediaSettings(dto: UpdateMediaSettingsDto) {
    const settings = normalizeMediaSettings(dto);
    await this.prisma.setting.upsert({
      where: { key: MEDIA_SETTING_KEY },
      create: {
        key: MEDIA_SETTING_KEY,
        value: settings as unknown as Prisma.InputJsonValue,
      },
      update: {
        value: settings as unknown as Prisma.InputJsonValue,
      },
    });
    return this.getMediaSettingsPayload();
  }

  async getPresentationSettings(): Promise<PresentationSettings> {
    const row = await this.prisma.setting.findUnique({ where: { key: PRESENTATION_SETTING_KEY } });
    return normalizePresentationSettings(row?.value ?? DEFAULT_PRESENTATION_SETTINGS);
  }

  async getPresentationSettingsPayload() {
    const settings = await this.getPresentationSettings();
    return {
      settings,
      formatOptions: PRESENTATION_FORMAT_OPTIONS.map(({ id, label, mimes, extensions }) => ({
        id,
        label,
        mimes,
        extensions,
      })),
      accept: presentationAcceptForFormats(settings.formats),
    };
  }

  async updatePresentationSettings(dto: UpdatePresentationSettingsDto) {
    const settings = normalizePresentationSettings(dto);
    await this.prisma.setting.upsert({
      where: { key: PRESENTATION_SETTING_KEY },
      create: {
        key: PRESENTATION_SETTING_KEY,
        value: settings as unknown as Prisma.InputJsonValue,
      },
      update: {
        value: settings as unknown as Prisma.InputJsonValue,
      },
    });
    return this.getPresentationSettingsPayload();
  }

  async getContactsSettings(): Promise<ContactsSettings> {
    const row = await this.prisma.setting.findUnique({ where: { key: CONTACTS_SETTING_KEY } });
    return normalizeContactsSettings(row?.value ?? DEFAULT_CONTACTS_SETTINGS);
  }

  async getContactsSettingsPayload() {
    const settings = await this.getContactsSettings();
    return {
      settings,
      phoneHref: phoneHref(settings.phone),
    };
  }

  async updateContactsSettings(dto: UpdateContactsSettingsDto) {
    const settings = normalizeContactsSettings(dto);
    await this.prisma.setting.upsert({
      where: { key: CONTACTS_SETTING_KEY },
      create: {
        key: CONTACTS_SETTING_KEY,
        value: settings as unknown as Prisma.InputJsonValue,
      },
      update: {
        value: settings as unknown as Prisma.InputJsonValue,
      },
    });
    return this.getContactsSettingsPayload();
  }

  async getMailingSettings(): Promise<MailingSettings> {
    const row = await this.prisma.setting.findUnique({ where: { key: MAILING_SETTING_KEY } });
    return normalizeMailingSettings(row?.value ?? DEFAULT_MAILING_SETTINGS);
  }

  async getMailingSettingsPayload() {
    return { settings: await this.getMailingSettings() };
  }

  async updateMailingSettings(dto: UpdateMailingSettingsDto) {
    const current = await this.getMailingSettings();
    const settings = normalizeMailingSettings({
      ...current,
      ...dto,
      flags: {
        ...current.flags,
        ...(dto.flags ?? {}),
      },
      templates: {
        ...current.templates,
        ...(dto.templates ?? {}),
      },
    });
    await this.prisma.setting.upsert({
      where: { key: MAILING_SETTING_KEY },
      create: {
        key: MAILING_SETTING_KEY,
        value: settings as unknown as Prisma.InputJsonValue,
      },
      update: {
        value: settings as unknown as Prisma.InputJsonValue,
      },
    });
    return this.getMailingSettingsPayload();
  }

  isMailingEnabled(settings: MailingSettings, type: MailingType) {
    return settings.enabled && settings.flags[type] !== false;
  }

  async getUiSettings(): Promise<UiSettings> {
    const row = await this.prisma.setting.findUnique({ where: { key: UI_SETTING_KEY } });
    return normalizeUiSettings(row?.value ?? DEFAULT_UI_SETTINGS);
  }

  async getUiSettingsPayload() {
    return { settings: await this.getUiSettings() };
  }

  async updateUiSettings(dto: UpdateUiSettingsDto) {
    const current = await this.getUiSettings();
    const settings = normalizeUiSettings({
      showNewBadges: dto.showNewBadges === undefined ? current.showNewBadges : dto.showNewBadges,
    });
    await this.prisma.setting.upsert({
      where: { key: UI_SETTING_KEY },
      create: {
        key: UI_SETTING_KEY,
        value: settings as unknown as Prisma.InputJsonValue,
      },
      update: {
        value: settings as unknown as Prisma.InputJsonValue,
      },
    });
    return this.getUiSettingsPayload();
  }

  async getBrandingSettings(): Promise<BrandingSettings> {
    const row = await this.prisma.setting.findUnique({ where: { key: BRANDING_SETTING_KEY } });
    return normalizeBrandingSettings(row?.value ?? DEFAULT_BRANDING_SETTINGS);
  }

  async getBrandingSettingsPayload() {
    const settings = await this.getBrandingSettings();
    return {
      settings,
      logoAccept: LOGO_ACCEPT,
      faviconAccept: FAVICON_ACCEPT,
      logoMaxMb: LOGO_MAX_MB,
      faviconMaxMb: FAVICON_MAX_MB,
    };
  }

  async updateBrandingSettings(dto: UpdateBrandingSettingsDto) {
    const current = await this.getBrandingSettings();
    const next = normalizeBrandingSettings({
      logoUrl: dto.logoUrl === undefined ? current.logoUrl : dto.logoUrl,
      faviconUrl: dto.faviconUrl === undefined ? current.faviconUrl : dto.faviconUrl,
    });
    if (dto.logoUrl === null && current.logoUrl) {
      await this.deleteUpload(current.logoUrl);
    }
    if (dto.faviconUrl === null && current.faviconUrl) {
      await this.deleteUpload(current.faviconUrl);
    }
    await this.saveBranding(next);
    return this.getBrandingSettingsPayload();
  }

  async uploadBrandingFile(kind: 'logo' | 'favicon', file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Оберіть файл');
    }
    const allowed = brandingMimes(kind);
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException(
        kind === 'logo'
          ? 'Логотип: PNG, JPEG, WebP, SVG або GIF'
          : 'Favicon: PNG, JPEG, WebP, SVG або ICO',
      );
    }
    if (file.size > brandingMaxBytes(kind)) {
      const max = kind === 'logo' ? LOGO_MAX_MB : FAVICON_MAX_MB;
      throw new BadRequestException(`Файл перевищує ${max} МБ`);
    }

    const current = await this.getBrandingSettings();
    const url = await this.writeBrandingFile(kind, file);
    const next: BrandingSettings =
      kind === 'logo'
        ? { ...current, logoUrl: url }
        : { ...current, faviconUrl: url };
    await this.saveBranding(next);
    const oldUrl = kind === 'logo' ? current.logoUrl : current.faviconUrl;
    if (oldUrl && oldUrl !== url) {
      await this.deleteUpload(oldUrl);
    }
    return this.getBrandingSettingsPayload();
  }

  private async saveBranding(settings: BrandingSettings) {
    await this.prisma.setting.upsert({
      where: { key: BRANDING_SETTING_KEY },
      create: {
        key: BRANDING_SETTING_KEY,
        value: settings as unknown as Prisma.InputJsonValue,
      },
      update: {
        value: settings as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async writeBrandingFile(kind: 'logo' | 'favicon', file: Express.Multer.File) {
    const ext = brandingExt(file.originalname, file.mimetype);
    const hash = createHash('sha1').update(randomBytes(8)).digest('hex').slice(0, 10);
    const filename = `${kind}-${Date.now()}-${hash}${ext}`;
    const relative = join('branding', filename);
    const absolute = join(process.cwd(), 'uploads', relative);
    await fs.mkdir(join(process.cwd(), 'uploads', 'branding'), { recursive: true });
    await fs.writeFile(absolute, file.buffer);
    return `/uploads/${relative.replace(/\\/g, '/')}`;
  }

  private async deleteUpload(url: string) {
    if (!url.startsWith('/uploads/')) return;
    const absolute = join(process.cwd(), url.replace(/^\//, ''));
    try {
      await fs.unlink(absolute);
    } catch {
      /* missing file */
    }
  }
}

function brandingExt(original: string, mime: string) {
  const fromName = extname(original).toLowerCase();
  if (fromName && fromName.length <= 8) {
    return fromName;
  }
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  if (mime === 'image/svg+xml') return '.svg';
  if (mime === 'image/x-icon' || mime === 'image/vnd.microsoft.icon' || mime === 'image/ico') {
    return '.ico';
  }
  return '.png';
}
