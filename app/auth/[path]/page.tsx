import { viewPaths } from "@better-auth-ui/core";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Auth } from "@/components/auth/auth";
import { Spinner } from "@/components/ui/spinner";

const AUTH_PATHS: string[] = Object.values(viewPaths.auth);

export function generateStaticParams() {
  return AUTH_PATHS.map((path) => ({ path }));
}

export default function AuthPage({ params }: PageProps<"/auth/[path]">) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      {/* Reading params inside Suspense keeps navigation to this page instant. */}
      <Suspense fallback={<Spinner />}>
        <AuthView params={params} />
      </Suspense>
    </main>
  );
}

async function AuthView({
  params,
}: {
  params: PageProps<"/auth/[path]">["params"];
}) {
  const { path } = await params;
  if (!AUTH_PATHS.includes(path)) notFound();

  return <Auth path={path} />;
}
