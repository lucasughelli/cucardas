import { prisma } from "../../lib/prisma";

interface DayCount {
  day: Date;
  count: bigint;
}

export async function getOverviewAnalytics() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [designsByDay, errorsByDay, activeStores, suspendedStores] = await Promise.all([
    prisma.$queryRaw<DayCount[]>`
      SELECT date_trunc('day', "created_at") AS day, COUNT(*) AS count
      FROM designs
      WHERE "created_at" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `,
    prisma.$queryRaw<DayCount[]>`
      SELECT date_trunc('day', "created_at") AS day, COUNT(*) AS count
      FROM error_logs
      WHERE "created_at" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `,
    prisma.store.count({ where: { status: "ACTIVE" } }),
    prisma.store.count({ where: { status: "SUSPENDED" } }),
  ]);

  return {
    designsByDay: designsByDay.map((row) => ({ day: row.day, count: Number(row.count) })),
    errorsByDay: errorsByDay.map((row) => ({ day: row.day, count: Number(row.count) })),
    activeStores,
    suspendedStores,
  };
}
