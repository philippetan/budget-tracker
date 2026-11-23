import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

/**
 * Returns the signed-in user, or redirects to sign-in.
 * Use when a page needs more than the id (e.g. the name for a greeting).
 */
export async function requireUser(): Promise<{ id: string; name: string }> {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");
  return { id: session.user.id, name: session.user.name };
}

/**
 * Returns the signed-in user's id, or redirects to sign-in.
 * Call this at the start of every page and server action that touches user data.
 */
export async function requireUserId(): Promise<string> {
  return (await requireUser()).id;
}
