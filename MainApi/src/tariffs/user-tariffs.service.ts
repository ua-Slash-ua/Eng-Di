import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Tariff, UserTariff, UserTariffPayment, UserTariffStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LessonsService } from '../lessons/lessons.service';
import { MailingsMailerService } from '../mailings/mailings.mailer';
import { addMonths, formatUaDate } from './tariff-dates';
import { splitParts } from './tariff-parts';
import { TariffsService } from './tariffs.service';

type TariffWithSub = UserTariff & { tariff: Tariff; payments: UserTariffPayment[] };

@Injectable()
export class UserTariffsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tariffs: TariffsService,
    private readonly lessons: LessonsService,
    private readonly mailer: MailingsMailerService,
  ) {}

  async settle(userId: number) {
    const now = new Date();
    await this.prisma.userTariff.updateMany({
      where: { userId, status: 'active', endsAt: { lte: now } },
      data: { status: 'expired' },
    });
    const due = await this.prisma.userTariff.findFirst({
      where: { userId, status: 'scheduled', startsAt: { lte: now } },
      orderBy: { startsAt: 'asc' },
    });
    if (!due) {
      return;
    }
    const stillActive = await this.prisma.userTariff.findFirst({
      where: { userId, status: 'active' },
    });
    if (!stillActive) {
      await this.prisma.userTariff.update({
        where: { id: due.id },
        data: { status: 'active' },
      });
    }
  }

  async overview(userId: number) {
    await this.settle(userId);
    await this.ensureUserPayments(userId);
    const [tariffs, current, scheduled, history] = await Promise.all([
      this.tariffs.list(),
      this.findByStatus(userId, 'active'),
      this.findByStatus(userId, 'scheduled'),
      this.prisma.userTariff.findMany({
        where: { userId, status: { not: 'cancelled' } },
        include: { tariff: true, payments: { orderBy: { partNumber: 'asc' } } },
        orderBy: { startsAt: 'desc' },
        take: 24,
      }),
    ]);
    return {
      tariffs: tariffs.map((item) => this.toPublicTariff(item)),
      current: current ? this.toPublicSub(current) : null,
      scheduled: scheduled ? this.toPublicSub(scheduled) : null,
      history: history.map((row) => this.toPublicSub(row)),
    };
  }

  async academy(userId: number) {
    await this.settle(userId);
    await this.ensureUserPayments(userId);
    const current = await this.findByStatus(userId, 'active');
    if (!current) {
      return {
        current: null,
        availableLessons: 0,
        totalLessons: 0,
        payments: [],
      };
    }
    const sub = this.toPublicSub(current);
    return {
      current: sub,
      availableLessons: sub.availableLessons,
      totalLessons: sub.totalLessons,
      payments: sub.payments,
    };
  }

  async select(userId: number, tariffId: number, confirm = false) {
    await this.settle(userId);
    const tariff = await this.tariffs.findById(tariffId);
    const current = await this.findByStatus(userId, 'active');
    const scheduled = await this.findByStatus(userId, 'scheduled');

    if (current && current.tariffId === tariff.id) {
      if (scheduled) {
        await this.prisma.userTariff.update({
          where: { id: scheduled.id },
          data: { status: 'cancelled' },
        });
        return {
          ...await this.overview(userId),
          needsConfirm: false,
          message: `Заплановану зміну скасовано. Залишаєтесь на тарифі «${current.tariff.title}» до ${formatUaDate(current.endsAt)}.`,
        };
      }
      return {
        ...await this.overview(userId),
        needsConfirm: false,
        message: `Тариф «${tariff.title}» уже активний до ${formatUaDate(current.endsAt)}.`,
      };
    }

    if (scheduled && scheduled.tariffId === tariff.id) {
      return {
        ...await this.overview(userId),
        needsConfirm: false,
        message: `Зміну на тариф «${tariff.title}» уже заплановано з ${formatUaDate(scheduled.startsAt)}.`,
      };
    }

    if (!current) {
      const startsAt = new Date();
      const endsAt = addMonths(startsAt, tariff.durationMonths);
      const created = await this.prisma.userTariff.create({
        data: {
          userId,
          tariffId: tariff.id,
          status: 'active',
          startsAt,
          endsAt,
        },
      });
      await this.ensurePayments(created.id);
      await this.mailTariffSelected(userId, tariff, startsAt);
      return {
        ...await this.overview(userId),
        needsConfirm: false,
        message: `Тариф «${tariff.title}» активовано. Діє з ${formatUaDate(startsAt)} по ${formatUaDate(endsAt)}.`,
      };
    }

    const startsAt = current.endsAt;
    const endsAt = addMonths(startsAt, tariff.durationMonths);
    const confirmMessage =
      `Ви хочете змінити тариф «${current.tariff.title}» на «${tariff.title}». ` +
      `Зміна відбудеться після завершення дії поточного тарифу (${formatUaDate(current.endsAt)}).`;

    if (!confirm) {
      return {
        ...await this.overview(userId),
        needsConfirm: true,
        message: confirmMessage,
      };
    }

    if (scheduled) {
      await this.prisma.userTariff.update({
        where: { id: scheduled.id },
        data: { status: 'cancelled' },
      });
    }
    const created = await this.prisma.userTariff.create({
      data: {
        userId,
        tariffId: tariff.id,
        status: 'scheduled',
        startsAt,
        endsAt,
      },
    });
    await this.ensurePayments(created.id);
    await this.mailTariffSelected(userId, tariff, startsAt);
    return {
      ...await this.overview(userId),
      needsConfirm: false,
      message:
        `Зміну тарифу заплановано: з «${current.tariff.title}» на «${tariff.title}». ` +
        `Новий тариф активується ${formatUaDate(startsAt)}.`,
    };
  }

  async cancelScheduled(userId: number) {
    await this.settle(userId);
    const scheduled = await this.findByStatus(userId, 'scheduled');
    if (!scheduled) {
      throw new BadRequestException('Немає запланованої зміни тарифу');
    }
    await this.prisma.userTariff.update({
      where: { id: scheduled.id },
      data: { status: 'cancelled' },
    });
    const current = await this.findByStatus(userId, 'active');
    return {
      ...await this.overview(userId),
      message: current
        ? `Заплановану зміну скасовано. Залишаєтесь на тарифі «${current.tariff.title}» до ${formatUaDate(current.endsAt)}.`
        : 'Заплановану зміну скасовано.',
    };
  }

  async listForUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    return this.overview(userId);
  }

  async setPaidCount(userId: number, userTariffId: number, paidCount: number) {
    const row = await this.prisma.userTariff.findFirst({
      where: { id: userTariffId, userId },
      include: { tariff: true, payments: { orderBy: { partNumber: 'asc' } } },
    });
    if (!row) {
      throw new NotFoundException('Підписку на тариф не знайдено');
    }
    await this.ensurePayments(row.id);
    const payments = await this.prisma.userTariffPayment.findMany({
      where: { userTariffId: row.id },
      orderBy: { partNumber: 'asc' },
    });
    if (paidCount < 0 || paidCount > payments.length) {
      throw new BadRequestException('Некоректна кількість оплачених частин');
    }
    const now = new Date();
    await this.prisma.$transaction(
      payments.map((payment) =>
        this.prisma.userTariffPayment.update({
          where: { id: payment.id },
          data: {
            paidAt: payment.partNumber <= paidCount ? payment.paidAt ?? now : null,
          },
        }),
      ),
    );
    await this.lessons.syncForTariff(row.id);
    return this.overview(userId);
  }

  private findByStatus(userId: number, status: UserTariffStatus) {
    return this.prisma.userTariff.findFirst({
      where: { userId, status },
      include: { tariff: true, payments: { orderBy: { partNumber: 'asc' } } },
      orderBy: { startsAt: 'desc' },
    });
  }

  private async ensureUserPayments(userId: number) {
    const rows = await this.prisma.userTariff.findMany({
      where: { userId },
      select: { id: true },
    });
    for (const row of rows) {
      await this.ensurePayments(row.id);
    }
  }

  private async ensurePayments(userTariffId: number) {
    const row = await this.prisma.userTariff.findUnique({
      where: { id: userTariffId },
      include: { tariff: true, payments: true },
    });
    if (!row || row.payments.length) {
      return;
    }
    const parts = this.paymentParts(row.tariff);
    const lessons = splitParts(row.tariff.lessons, parts);
    const amounts = splitParts(row.tariff.price, parts);
    await this.prisma.userTariffPayment.createMany({
      data: lessons.map((count, index) => ({
        userTariffId: row.id,
        partNumber: index + 1,
        lessons: count,
        amount: amounts[index],
      })),
    });
  }

  private paymentParts(item: Tariff) {
    if (item.installmentCount != null && item.installmentCount >= 1) {
      return item.installmentCount;
    }
    return item.paymentMode === 'installments' ? 2 : 1;
  }

  private toPublicTariff(item: Tariff) {
    return {
      id: item.id,
      title: item.title,
      lessons: item.lessons,
      price: item.price,
      oldPrice: item.oldPrice,
      popular: item.popular,
      note: item.note,
      variant: item.variant,
      icon: item.icon,
      lessonPrice: item.lessonPrice || Math.round(item.price / Math.max(1, item.lessons)),
      installmentCount: this.paymentParts(item),
      durationMonths: item.durationMonths,
      frozenLessonsPerMonth: item.frozenLessonsPerMonth,
    };
  }

  private toPublicSub(row: TariffWithSub) {
    const payments = (row.payments ?? []).map((item) => ({
      id: item.id,
      partNumber: item.partNumber,
      lessons: item.lessons,
      amount: item.amount,
      paid: Boolean(item.paidAt),
      paidAt: item.paidAt ? item.paidAt.toISOString() : null,
    }));
    const availableLessons = payments.filter((item) => item.paid).reduce((sum, item) => sum + item.lessons, 0);
    return {
      id: row.id,
      status: row.status,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      tariff: this.toPublicTariff(row.tariff),
      payments,
      paidCount: payments.filter((item) => item.paid).length,
      availableLessons,
      totalLessons: row.tariff.lessons,
    };
  }

  private async mailTariffSelected(userId: number, tariff: Tariff, startsAt: Date) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, firstName: true, lastName: true, middleName: true },
    });
    await this.mailer.sendToUser('tariff_selected', user, {
      tariff_title: tariff.title,
      lessons_count: String(tariff.lessons),
      starts_on: formatUaDate(startsAt),
      cabinet_url: this.mailer.cabinetUrl('student'),
    });
  }
}
