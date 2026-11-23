import "server-only";

import { monthRange, shiftMonth, type MonthKey } from "@/lib/dates";
import { prisma } from "@/lib/db";

export type MonthCashFlow = {
  month: MonthKey;
  incomeCents: number;
  expenseCents: number;
};

/**
 * Income and expense totals for the `count` months ending with `lastMonth`,
 * oldest first. Months with no activity are included as zeros. Transfers
 * between the user's own accounts are neither, so they're left out.
 */
export async function getCashFlow(
  userId: string,
  lastMonth: MonthKey,
  count: number,
): Promise<MonthCashFlow[]> {
  const firstMonth = shiftMonth(lastMonth, -(count - 1));
  const start = monthRange(firstMonth).start;
  const end = monthRange(lastMonth).end;

  const rows = await prisma.$queryRaw<
    { month: string; type: "INCOME" | "EXPENSE"; cents: bigint }[]
  >`
    SELECT to_char("occurredOn", 'YYYY-MM') AS month,
           "type"::text AS type,
           SUM("amountCents")::bigint AS cents
    FROM "transactions"
    WHERE "userId" = ${userId}::uuid
      AND "occurredOn" >= ${start} AND "occurredOn" < ${end}
    GROUP BY 1, 2
  `;

  return Array.from({ length: count }, (_, i) => {
    const month = shiftMonth(firstMonth, i);
    const sum = (type: string) =>
      Number(rows.find((r) => r.month === month && r.type === type)?.cents ?? 0);
    return { month, incomeCents: sum("INCOME"), expenseCents: sum("EXPENSE") };
  });
}

export type CategorySpending = {
  /** null for uncategorised expenses. */
  id: string | null;
  name: string;
  icon: string;
  color: string | null;
  spentCents: number;
};

/** A month's expenses per category, largest first. */
export async function getSpendingByCategory(
  userId: string,
  month: MonthKey,
): Promise<CategorySpending[]> {
  const { start, end } = monthRange(month);
  const sums = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "EXPENSE", occurredOn: { gte: start, lt: end } },
    _sum: { amountCents: true },
  });

  const ids = sums.flatMap((s) => (s.categoryId ? [s.categoryId] : []));
  const categories = await prisma.category.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true, name: true, icon: true, color: true },
  });
  const byId = new Map(categories.map((c) => [c.id, c]));

  return sums
    .map((s) => {
      const category = s.categoryId ? byId.get(s.categoryId) : undefined;
      return {
        id: category?.id ?? null,
        name: category?.name ?? "Uncategorised",
        icon: category?.icon ?? "tag",
        color: category?.color ?? null,
        spentCents: s._sum.amountCents ?? 0,
      };
    })
    .filter((c) => c.spentCents > 0)
    .sort((a, b) => b.spentCents - a.spentCents);
}

export type SetupProgress = {
  hasAccount: boolean;
  hasTransaction: boolean;
  hasBudget: boolean;
};

/** Which first steps a new user has done, for the "Get started" checklist. */
export async function getSetupProgress(userId: string): Promise<SetupProgress> {
  const [account, transaction, transfer, budget] = await Promise.all([
    prisma.account.findFirst({ where: { userId }, select: { id: true } }),
    prisma.transaction.findFirst({ where: { userId }, select: { id: true } }),
    prisma.transfer.findFirst({ where: { userId }, select: { id: true } }),
    prisma.budget.findFirst({ where: { userId }, select: { id: true } }),
  ]);
  return {
    hasAccount: account !== null,
    hasTransaction: transaction !== null || transfer !== null,
    hasBudget: budget !== null,
  };
}
