import { BlockType } from '@prisma/client';

export const BLOCK_DEFAULTS: Record<BlockType, Record<string, unknown>> = {
  HERO: {
    kicker: 'ENGDI ENGLISH SCHOOL',
    title: 'Англійська, з якої хочеться почати сьогодні',
    text: 'Короткі заняття, жива мова і зрозумілий прогрес. Залиште заявку — підберемо рівень і розклад.',
    buttonText: 'Записатись зараз',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
  },
  ABOUT: {
    title: 'Про школу',
    text: 'EngDi — школа англійської з фокусом на практику. Тут зʼявиться короткий текст про підхід, викладачів і формат навчання.',
  },
  TARIFFS: {
    title: 'Тарифи',
    items: [
      { name: 'Start', price: 'від 2 500 грн', description: 'Старт з нуля, базові заняття.' },
      { name: 'Standard', price: 'від 4 200 грн', description: 'Регулярні уроки і speaking.' },
      { name: 'Intensive', price: 'від 6 800 грн', description: 'Щільний графік і швидкий прогрес.' },
    ],
  },
  RULES: {
    title: 'Правила школи',
    items: [
      'Заняття починаються вчасно.',
      'Перенесення уроку — за 12 годин.',
      'Домашні завдання допомагають тримати темп.',
      'Повага до викладача і групи обовʼязкова.',
    ],
  },
  FORM: {
    title: 'Заявка на навчання',
    text: 'Залиште контакти — ми напишемо і підкажемо, з якого рівня почати.',
    buttonText: 'Надіслати',
  },
};
