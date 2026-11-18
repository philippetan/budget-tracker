import { Prisma } from "@/lib/generated/prisma/client";

/** What every server action returns. `fieldErrors` keys match the form fields. */
export type ActionResult<TFields = Record<string, unknown>> =
  | { ok: true }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Partial<Record<keyof TFields, string[]>>;
    };

/** True for a Prisma error with this code, e.g. P2002 (unique), P2003 (foreign key). */
export function isPrismaError(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}
