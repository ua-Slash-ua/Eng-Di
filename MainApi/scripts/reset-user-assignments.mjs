import './load-env.mjs';
import { PrismaClient } from '@prisma/client';

const emailPattern = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? 'so.slashua@gmail.com')
  .trim()
  .toLowerCase();

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      email: emailPattern.includes('@')
        ? { equals: emailPattern }
        : { startsWith: emailPattern },
    },
    select: { id: true, email: true, name: true, userRole: true, teacherId: true },
  });

  if (!user) {
    const candidates = await prisma.user.findMany({
      where: { email: { contains: 'slashua@gmail.com' } },
      select: { id: true, email: true },
    });
    throw new Error(
      `User not found for "${emailPattern}". Candidates: ${candidates.map((u) => u.email).join(', ') || 'none'}`,
    );
  }

  console.log(`Resetting assignments for #${user.id} ${user.email} (${user.name})`);

  const counts = await prisma.$transaction(async (tx) => {
    const userId = user.id;
    const lessonIds = (
      await tx.lesson.findMany({
        where: { OR: [{ studentId: userId }, { teacherId: userId }] },
        select: { id: true },
      })
    ).map((l) => l.id);

    const teacherLessonIds = (
      await tx.teacherLesson.findMany({ where: { teacherId: userId }, select: { id: true } })
    ).map((l) => l.id);

    const teacherUnitIds = (
      await tx.teacherUnit.findMany({ where: { teacherId: userId }, select: { id: true } })
    ).map((u) => u.id);

    const result = {};

    if (lessonIds.length) {
      result.mailingTasksForLessons = (
        await tx.mailingTask.deleteMany({ where: { lessonId: { in: lessonIds } } })
      ).count;
    }

    result.mailingTasks = (await tx.mailingTask.deleteMany({ where: { userId } })).count;
    result.lessons = (await tx.lesson.deleteMany({
      where: { OR: [{ studentId: userId }, { teacherId: userId }] },
    })).count;
    result.userTariffs = (await tx.userTariff.deleteMany({ where: { userId } })).count;
    result.scheduleRules = (await tx.scheduleRule.deleteMany({ where: { userId } })).count;
    result.teacherAccesses = (await tx.teacherContentAccess.deleteMany({ where: { teacherId: userId } }))
      .count;
    result.grantedAccesses = (await tx.teacherContentAccess.deleteMany({ where: { grantedBy: userId } }))
      .count;

    if (teacherUnitIds.length) {
      result.teacherUnitLessons = (
        await tx.teacherUnitLesson.deleteMany({ where: { unitId: { in: teacherUnitIds } } })
      ).count;
    }

    result.teacherLessons = (await tx.teacherLesson.deleteMany({ where: { teacherId: userId } })).count;
    result.teacherUnits = (await tx.teacherUnit.deleteMany({ where: { teacherId: userId } })).count;
    result.testAccessGrants = (await tx.testAccessGrant.deleteMany({ where: { userId } })).count;
    result.testAttempts = (await tx.testAttempt.deleteMany({ where: { userId } })).count;
    result.reviews = (await tx.review.deleteMany({ where: { OR: [{ userId }, { teacherId: userId }] } }))
      .count;
    result.studentsUnlinked = (
      await tx.user.updateMany({ where: { teacherId: userId }, data: { teacherId: null } })
    ).count;
    result.sessions = (await tx.authSession.deleteMany({ where: { userId } })).count;
    result.authEvents = (await tx.authEvent.deleteMany({ where: { userId } })).count;
    result.passwordResetTokens = (await tx.passwordResetToken.deleteMany({ where: { userId } })).count;

    await tx.user.update({
      where: { id: userId },
      data: { teacherId: null },
    });

    return result;
  });

  console.log('Deleted / cleared:', counts);
  console.log('Done. User account kept; re-assign lessons/tariffs manually.');
}

main()
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
