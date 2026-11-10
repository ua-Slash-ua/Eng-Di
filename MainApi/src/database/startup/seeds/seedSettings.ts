import type { PrismaClient } from '@prisma/client';
import {
  BRANDING_SETTING_KEY,
  DEFAULT_BRANDING_SETTINGS,
} from '../../../settings/branding-settings';
import {
  CONTACTS_SETTING_KEY,
  DEFAULT_CONTACTS_SETTINGS,
} from '../../../settings/contact-settings';
import { DEFAULT_MEDIA_SETTINGS, MEDIA_SETTING_KEY } from '../../../settings/media-settings';
import {
  DEFAULT_PRESENTATION_SETTINGS,
  PRESENTATION_SETTING_KEY,
} from '../../../settings/presentation-settings';

export async function seedSettings(prisma: PrismaClient) {
  await prisma.setting.upsert({
    where: { key: MEDIA_SETTING_KEY },
    create: {
      key: MEDIA_SETTING_KEY,
      value: DEFAULT_MEDIA_SETTINGS,
    },
    update: {},
  });
  await prisma.setting.upsert({
    where: { key: CONTACTS_SETTING_KEY },
    create: {
      key: CONTACTS_SETTING_KEY,
      value: DEFAULT_CONTACTS_SETTINGS,
    },
    update: {},
  });
  await prisma.setting.upsert({
    where: { key: BRANDING_SETTING_KEY },
    create: {
      key: BRANDING_SETTING_KEY,
      value: DEFAULT_BRANDING_SETTINGS,
    },
    update: {},
  });
  await prisma.setting.upsert({
    where: { key: PRESENTATION_SETTING_KEY },
    create: {
      key: PRESENTATION_SETTING_KEY,
      value: DEFAULT_PRESENTATION_SETTINGS,
    },
    update: {},
  });
}
