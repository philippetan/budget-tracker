import { viewPaths } from "@better-auth-ui/core";
import { notFound } from "next/navigation";

import { Auth } from "@/components/auth/auth";

const AUTH_PATHS: string[] = Object.values(viewPaths.auth);

export function generateStaticParams() {
  return AUTH_PATHS.map((path) => ({ path }));
}

export default async function AuthPage({ params }: PageProps<"/auth/[path]">) {
  const { path } = await params;
  if (!AUTH_PATHS.includes(path)) notFound();

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Auth path={path} />
    </main>
  );
}
