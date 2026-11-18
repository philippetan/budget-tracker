import { connection } from "next/server";
import { Suspense } from "react";

import { ComingSoon, PageHeader } from "@/components/app-shell/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth/server";

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<Skeleton className="mb-6 h-14 w-64" />}>
        <Greeting />
      </Suspense>
      <ComingSoon />
    </>
  );
}

async function Greeting() {
  // Pages check the session themselves too; never rely on proxy.ts alone.
  await connection();
  const { data: session } = await auth.getSession();
  const firstName = session?.user.name.split(" ")[0];

  return (
    <PageHeader
      title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
      description="Your monthly overview will appear here."
    />
  );
}
