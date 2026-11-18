import "server-only";

import { prisma } from "@/lib/db";
import type { AccountType } from "@/lib/generated/prisma/enums";

export type AccountWithBalance = {
  id: string;
  name: string;
  type: AccountType;
  initialBalanceCents: number;
  balanceCents: number;
  archived: boolean;
  /** Has transactions or transfers, so it can be archived but not deleted. */
  hasActivity: boolean;
};

/**
 * All of a user's accounts with their current balance:
 * initial + income - expenses + transfers in - transfers out.
 */
export async function getAccountsWithBalances(
  userId: string,
): Promise<AccountWithBalance[]> {
  const [accounts, transactionSums, transfersOut, transfersIn] =
    await Promise.all([
      prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.transaction.groupBy({
        by: ["accountId", "type"],
        where: { userId },
        _sum: { amountCents: true },
      }),
      prisma.transfer.groupBy({
        by: ["fromAccountId"],
        where: { userId },
        _sum: { amountCents: true },
      }),
      prisma.transfer.groupBy({
        by: ["toAccountId"],
        where: { userId },
        _sum: { amountCents: true },
      }),
    ]);

  const change = new Map<string, number>();
  const active = new Set<string>();
  const add = (accountId: string, cents: number) => {
    change.set(accountId, (change.get(accountId) ?? 0) + cents);
    active.add(accountId);
  };

  for (const row of transactionSums) {
    const sum = row._sum.amountCents ?? 0;
    add(row.accountId, row.type === "INCOME" ? sum : -sum);
  }
  for (const row of transfersOut) add(row.fromAccountId, -(row._sum.amountCents ?? 0));
  for (const row of transfersIn) add(row.toAccountId, row._sum.amountCents ?? 0);

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    initialBalanceCents: account.initialBalanceCents,
    balanceCents: account.initialBalanceCents + (change.get(account.id) ?? 0),
    archived: account.archivedAt !== null,
    hasActivity: active.has(account.id),
  }));
}
