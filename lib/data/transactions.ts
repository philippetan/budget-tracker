import "server-only";

import { ensureStarterCategories } from "@/lib/data/categories";
import { dateToISO, monthRange, type MonthKey } from "@/lib/dates";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { AccountType, TransactionType } from "@/lib/generated/prisma/enums";

export type ActivityFilter = "ALL" | "EXPENSE" | "INCOME" | "TRANSFER";

export type TransactionItem = {
  kind: "transaction";
  id: string;
  type: TransactionType;
  amountCents: number;
  occurredOn: string; // "2026-11-19"
  note: string | null;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  category: { name: string; icon: string; color: string | null } | null;
  createdAt: number;
};

export type TransferItem = {
  kind: "transfer";
  id: string;
  amountCents: number;
  occurredOn: string;
  note: string | null;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  createdAt: number;
};

export type ActivityItem = TransactionItem | TransferItem;

export type MonthActivity = {
  items: ActivityItem[];
  /** Totals for the whole month, whatever the filter. Transfers excluded. */
  incomeCents: number;
  expenseCents: number;
};

const transactionInclude = {
  account: { select: { name: true } },
  category: { select: { name: true, icon: true, color: true } },
} as const;

const transferInclude = {
  fromAccount: { select: { name: true } },
  toAccount: { select: { name: true } },
} as const;

const newestFirst = [
  { occurredOn: "desc" as const },
  { createdAt: "desc" as const },
];

type TransactionRow = Prisma.TransactionGetPayload<{
  include: typeof transactionInclude;
}>;
type TransferRow = Prisma.TransferGetPayload<{
  include: typeof transferInclude;
}>;

/** Turns database rows into one list, newest first. */
function mergeActivity(
  transactions: TransactionRow[],
  transfers: TransferRow[],
): ActivityItem[] {
  return [
    ...transactions.map(
      (t): TransactionItem => ({
        kind: "transaction",
        id: t.id,
        type: t.type,
        amountCents: t.amountCents,
        occurredOn: dateToISO(t.occurredOn),
        note: t.note,
        accountId: t.accountId,
        accountName: t.account.name,
        categoryId: t.categoryId,
        category: t.category,
        createdAt: t.createdAt.getTime(),
      }),
    ),
    ...transfers.map(
      (t): TransferItem => ({
        kind: "transfer",
        id: t.id,
        amountCents: t.amountCents,
        occurredOn: dateToISO(t.occurredOn),
        note: t.note,
        fromAccountId: t.fromAccountId,
        fromAccountName: t.fromAccount.name,
        toAccountId: t.toAccountId,
        toAccountName: t.toAccount.name,
        createdAt: t.createdAt.getTime(),
      }),
    ),
  ].sort(
    (a, b) =>
      b.occurredOn.localeCompare(a.occurredOn) || b.createdAt - a.createdAt,
  );
}

/** The latest transactions and transfers across all months. */
export async function getRecentActivity(
  userId: string,
  limit: number,
): Promise<ActivityItem[]> {
  const [transactions, transfers] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      include: transactionInclude,
      orderBy: newestFirst,
      take: limit,
    }),
    prisma.transfer.findMany({
      where: { userId },
      include: transferInclude,
      orderBy: newestFirst,
      take: limit,
    }),
  ]);
  return mergeActivity(transactions, transfers).slice(0, limit);
}

/** A month's transactions and transfers, newest first. */
export async function getMonthActivity(
  userId: string,
  month: MonthKey,
  filter: ActivityFilter,
): Promise<MonthActivity> {
  const { start, end } = monthRange(month);
  const inMonth = { userId, occurredOn: { gte: start, lt: end } };

  const [transactions, transfers, totals] = await Promise.all([
    filter === "TRANSFER"
      ? []
      : prisma.transaction.findMany({
          where: filter === "ALL" ? inMonth : { ...inMonth, type: filter },
          include: transactionInclude,
          orderBy: newestFirst,
        }),
    filter === "ALL" || filter === "TRANSFER"
      ? prisma.transfer.findMany({
          where: inMonth,
          include: transferInclude,
          orderBy: newestFirst,
        })
      : [],
    prisma.transaction.groupBy({
      by: ["type"],
      where: inMonth,
      _sum: { amountCents: true },
    }),
  ]);

  const items = mergeActivity(transactions, transfers);

  const sumOf = (type: TransactionType) =>
    totals.find((row) => row.type === type)?._sum.amountCents ?? 0;

  return {
    items,
    incomeCents: sumOf("INCOME"),
    expenseCents: sumOf("EXPENSE"),
  };
}

export type FormAccount = {
  id: string;
  name: string;
  type: AccountType;
  archived: boolean;
};

export type FormCategory = {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string | null;
  archived: boolean;
};

export type TransactionFormOptions = {
  accounts: FormAccount[];
  categories: FormCategory[];
};

/**
 * Accounts and categories for the transaction form. Archived ones are included
 * so editing an old transaction still shows its account/category; the form
 * only offers them for that transaction.
 */
export async function getTransactionFormOptions(
  userId: string,
): Promise<TransactionFormOptions> {
  await ensureStarterCategories(userId);

  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, type: true, archivedAt: true },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        icon: true,
        color: true,
        archivedAt: true,
      },
    }),
  ]);

  return {
    accounts: accounts.map(({ archivedAt, ...a }) => ({
      ...a,
      archived: archivedAt !== null,
    })),
    categories: categories.map(({ archivedAt, ...c }) => ({
      ...c,
      archived: archivedAt !== null,
    })),
  };
}
