import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

/**
 * Returns the signed-in user's id, or redirects to sign-in.
 * Call this at the start of every page and server action that touches user data.
 */
export async function requireUserId(): Promise<string> {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");
  return session.user.id;
}
