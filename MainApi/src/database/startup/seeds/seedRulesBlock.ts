import type { PrismaClient } from '@prisma/client';
import {
  RULES_META_DEFAULTS,
  RULES_PLAQUE_DEFAULT,
  RULES_TITLE_DEFAULT,
} from '../../../blocks/block-types';

export async function seedRulesBlock(prisma: PrismaClient) {
  const existing = await prisma.block.findFirst({ where: { type: 'rules' } });
  if (existing) return;

  const rules = await prisma.schoolRule.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    take: 8,
  });

  await prisma.block.create({
    data: {
      type: 'rules',
      name: 'Правила — головна',
      plaque: RULES_PLAQUE_DEFAULT,
      title: RULES_TITLE_DEFAULT,
      meta: {
        create: Object.entries({
          ...RULES_META_DEFAULTS,
          rule_ids: JSON.stringify(rules.map((item) => item.id)),
        }).map(([key, value]) => ({ key, value })),
      },
    },
  });
}
