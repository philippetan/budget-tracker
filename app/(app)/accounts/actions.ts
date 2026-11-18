"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  accountFormSchema,
  type AccountFormInput,
  type FieldErrors,
} from "@/lib/validations/account";

export type ActionResult =
  | { ok: true }
  | { ok: false; message?: string; fieldErrors?: FieldErrors };

const accountId = z.uuid();

function isPrismaError(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

function duplicateName(name: string): ActionResult {
  return {
    ok: false,
    fieldErrors: { name: [`You already have an account named "${name}"`] },
  };
}

export async function createAccount(
  input: AccountFormInput,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = accountFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    await prisma.account.create({
      data: {
        userId,
        name: parsed.data.name,
        type: parsed.data.type,
        initialBalanceCents: parsed.data.initialBalance,
      },
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) return duplicateName(parsed.data.name);
    throw error;
  }

  refresh();
  return { ok: true };
}

export async function updateAccount(
  id: string,
  input: AccountFormInput,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = accountFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  if (!accountId.safeParse(id).success) {
    return { ok: false, message: "Account not found" };
  }

  try {
    // Filtering by userId means users can only change their own accounts.
    const { count } = await prisma.account.updateMany({
      where: { id, userId },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        initialBalanceCents: parsed.data.initialBalance,
      },
    });
    if (count === 0) return { ok: false, message: "Account not found" };
  } catch (error) {
    if (isPrismaError(error, "P2002")) return duplicateName(parsed.data.name);
    throw error;
  }

  refresh();
  return { ok: true };
}

export async function setAccountArchived(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!accountId.safeParse(id).success) {
    return { ok: false, message: "Account not found" };
  }

  const { count } = await prisma.account.updateMany({
    where: { id, userId },
    data: { archivedAt: archived ? new Date() : null },
  });
  if (count === 0) return { ok: false, message: "Account not found" };

  refresh();
  return { ok: true };
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!accountId.safeParse(id).success) {
    return { ok: false, message: "Account not found" };
  }

  try {
    const { count } = await prisma.account.deleteMany({
      where: { id, userId },
    });
    if (count === 0) return { ok: false, message: "Account not found" };
  } catch (error) {
    // The database blocks deleting accounts that have transactions/transfers.
    if (isPrismaError(error, "P2003")) {
      return {
        ok: false,
        message:
          "This account has transactions or transfers, so it can't be deleted. Archive it instead.",
      };
    }
    throw error;
  }

  refresh();
  return { ok: true };
}
