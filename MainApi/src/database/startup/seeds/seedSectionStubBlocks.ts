import type { PrismaClient } from '@prisma/client';

const DEFAULT_LEVELS_JSON = JSON.stringify([
  { code: 'A1', title: 'Старт', description: 'Прості фрази й побут' },
  { code: 'A2', title: 'База', description: 'Впевнені діалоги' },
  { code: 'B1', title: 'Середній', description: 'Про роботу й подорожі' },
  { code: 'B2', title: 'Вільний', description: 'Дискусії без пауз' },
  { code: 'C1', title: 'Просунутий', description: 'Нюанси й гумор' },
  { code: 'C2', title: 'Носійський', description: 'Мислиш англійською' },
]);

const STUBS = [
  {
    type: 'about',
    name: 'Про школу — головна',
    plaque: 'Про школу',
    title: 'Привіт, це EngDi — і ми вчимо говорити, а не боятись помилок',
    meta: {
      accent_text: 'Онлайн · 7 років практики · з будь-якої точки світу',
      body: '',
      photo_url: '',
      photo_placeholder: 'E',
      stat_ids: '[]',
    },
  },
  {
    type: 'levels',
    name: 'Прогрес — головна',
    plaque: 'Прогрес',
    title: 'Від першого «hello» до вільної розмови',
    meta: {
      description:
        'Ведуть учня по шкалі CEFR крок за кроком — з чіткими критеріями переходу на наступний рівень.',
      levels: DEFAULT_LEVELS_JSON,
    },
  },
  {
    type: 'formats',
    name: 'Формати — головна',
    plaque: 'Формати',
    title: 'Заняття під твою мету',
    meta: {
      description: 'Все — індивідуально, онлайн, у зручний для тебе час.',
      formats: '[]',
    },
  },
] as const;

function isEmptyLevels(value?: string | null) {
  if (!value?.trim()) return true;
  try {
    const parsed = JSON.parse(value) as unknown;
    return !Array.isArray(parsed) || parsed.length === 0;
  } catch {
    return true;
  }
}

export async function seedSectionStubBlocks(prisma: PrismaClient) {
  for (const stub of STUBS) {
    const existing = await prisma.block.findFirst({
      where: { type: stub.type },
      include: { meta: true },
    });
    if (!existing) {
      await prisma.block.create({
        data: {
          type: stub.type,
          name: stub.name,
          plaque: stub.plaque,
          title: stub.title,
          meta: {
            create: Object.entries(stub.meta).map(([key, value]) => ({ key, value })),
          },
        },
      });
      continue;
    }

    if (stub.type === 'levels') {
      const levelsMeta = existing.meta.find((row) => row.key === 'levels');
      if (!levelsMeta) {
        await prisma.blockMeta.create({
          data: { blockId: existing.id, key: 'levels', value: DEFAULT_LEVELS_JSON },
        });
      } else if (isEmptyLevels(levelsMeta.value)) {
        await prisma.blockMeta.update({
          where: { id: levelsMeta.id },
          data: { value: DEFAULT_LEVELS_JSON },
        });
      }
    }
  }
}
