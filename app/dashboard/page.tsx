import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <AccountSummary />
      </Suspense>
    </main>
  );
}

async function AccountSummary() {
  // The proxy already redirects signed-out visitors; check again here
  // because pages must never trust the proxy alone for data access.
  // connection() marks this as request-time only, so the build doesn't try
  // to read session cookies while prerendering.
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  // Reads the user's row from the neon_auth schema in Postgres, which proves
  // the app's database connection and auth share the same database.
  // neon_auth isn't part of the Prisma schema, so this uses a raw query.
  const rows = await prisma.$queryRaw<{ created_at: Date }[]>`
    select "createdAt" as created_at from neon_auth."user"
    where id = ${session.user.id}::uuid
  `;

  return (
    <section className="flex flex-col gap-4">
      <p>
        Signed in as <strong>{session.user.name}</strong> ({session.user.email})
      </p>
      <p className="text-sm text-muted-foreground">
        Account created {rows[0]?.created_at.toISOString() ?? "unknown"} (read
        from Postgres)
      </p>
      <Button
        className="self-start"
        variant="outline"
        render={<Link href="/auth/sign-out" />}
      >
        Sign out
      </Button>
    </section>
  );
}
