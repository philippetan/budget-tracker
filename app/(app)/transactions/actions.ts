"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions";
import { requireUserId } from "@/lib/auth/session";
import { isoToDate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import {
  transactionFormSchema,
  transferFormSchema,
  type TransactionFormInput,
  type TransferFormInput,
} from "@/lib/validations/transaction";

type TransactionResult = ActionResult<TransactionFormInput>;
type TransferResult = ActionResult<TransferFormInput>;

const recordId = z.uuid();
const notFound = { ok: false, message: "Not found" } as const;

/**
 * Checks an account belongs to the user. Archived accounts are only allowed
 * when the record already used them (editing an old entry).
 */
async function accountError(
  userId: string,
  accountId: string,
  previousId?: string,
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { archivedAt: true },
  });
  if (!account) return "Choose one of your accounts";
  if (account.archivedAt && accountId !== previousId) {
    return "This account is archived. Restore it on the Accounts page first.";
  }
  return null;
}

/** Same as accountError, and the category must match the transaction type. */
async function categoryError(
  userId: string,
  categoryId: string,
  type: "EXPENSE" | "INCOME",
  previousId?: string | null,
): Promise<string | null> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { archivedAt: true, type: true },
  });
  if (!category) return "Choose one of your categories";
  if (category.type !== type) {
    return `Choose ${type === "INCOME" ? "an income" : "an expense"} category`;
  }
  if (category.archivedAt && categoryId !== previousId) {
    return "This category is archived. Restore it on the Categories page first.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Income and expense transactions
// ---------------------------------------------------------------------------

async function saveTransaction(
  input: TransactionFormInput,
  id?: string,
): Promise<TransactionResult> {
  const userId = await requireUserId();
  const parsed = transactionFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;

  let previous: { accountId: string; categoryId: string | null } | null = null;
  if (id) {
    if (!recordId.safeParse(id).success) return notFound;
    previous = await prisma.transaction.findFirst({
      where: { id, userId },
      select: { accountId: true, categoryId: true },
    });
    if (!previous) return notFound;
  }

  const [accountProblem, categoryProblem] = await Promise.all([
    accountError(userId, data.accountId, previous?.accountId),
    data.categoryId
      ? categoryError(userId, data.categoryId, data.type, previous?.categoryId)
      : null,
  ]);
  if (accountProblem || categoryProblem) {
    return {
      ok: false,
      fieldErrors: {
        ...(accountProblem ? { accountId: [accountProblem] } : {}),
        ...(categoryProblem ? { categoryId: [categoryProblem] } : {}),
      },
    };
  }

  const values = {
    type: data.type,
    amountCents: data.amount,
    accountId: data.accountId,
    categoryId: data.categoryId,
    occurredOn: isoToDate(data.occurredOn),
    note: data.note,
  };

  if (id) {
    const { count } = await prisma.transaction.updateMany({
      where: { id, userId },
      data: values,
    });
    if (count === 0) return notFound;
  } else {
    await prisma.transaction.create({ data: { ...values, userId } });
  }

  refresh();
  return { ok: true };
}

export async function createTransaction(input: TransactionFormInput) {
  return saveTransaction(input);
}

export async function updateTransaction(id: string, input: TransactionFormInput) {
  return saveTransaction(input, id);
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!recordId.safeParse(id).success) return notFound;

  const { count } = await prisma.transaction.deleteMany({
    where: { id, userId },
  });
  if (count === 0) return notFound;

  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Transfers between the user's own accounts
// ---------------------------------------------------------------------------

async function saveTransfer(
  input: TransferFormInput,
  id?: string,
): Promise<TransferResult> {
  const userId = await requireUserId();
  const parsed = transferFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;

  let previous: { fromAccountId: string; toAccountId: string } | null = null;
  if (id) {
    if (!recordId.safeParse(id).success) return notFound;
    previous = await prisma.transfer.findFirst({
      where: { id, userId },
      select: { fromAccountId: true, toAccountId: true },
    });
    if (!previous) return notFound;
  }

  const [fromProblem, toProblem] = await Promise.all([
    accountError(userId, data.fromAccountId, previous?.fromAccountId),
    accountError(userId, data.toAccountId, previous?.toAccountId),
  ]);
  if (fromProblem || toProblem) {
    return {
      ok: false,
      fieldErrors: {
        ...(fromProblem ? { fromAccountId: [fromProblem] } : {}),
        ...(toProblem ? { toAccountId: [toProblem] } : {}),
      },
    };
  }

  const values = {
    amountCents: data.amount,
    fromAccountId: data.fromAccountId,
    toAccountId: data.toAccountId,
    occurredOn: isoToDate(data.occurredOn),
    note: data.note,
  };

  if (id) {
    const { count } = await prisma.transfer.updateMany({
      where: { id, userId },
      data: values,
    });
    if (count === 0) return notFound;
  } else {
    await prisma.transfer.create({ data: { ...values, userId } });
  }

  refresh();
  return { ok: true };
}

export async function createTransfer(input: TransferFormInput) {
  return saveTransfer(input);
}

export async function updateTransfer(id: string, input: TransferFormInput) {
  return saveTransfer(input, id);
}

export async function deleteTransfer(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!recordId.safeParse(id).success) return notFound;

  const { count } = await prisma.transfer.deleteMany({ where: { id, userId } });
  if (count === 0) return notFound;

  refresh();
  return { ok: true };
}
