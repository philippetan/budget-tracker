"use client";

import { useAuth, useSession } from "@better-auth-ui/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Landing page buttons. The session is checked in the browser so the page
 * itself stays static (fast, and cacheable for the showcase site).
 */
export function HomeActions() {
  const { authClient } = useAuth();
  const { data: session } = useSession(authClient);

  if (session?.user) {
    return (
      <Button nativeButton={false} render={<Link href="/dashboard" />}>
        Go to dashboard
      </Button>
    );
  }

  return (
    <>
      {/* nativeButton={false}: these render as links (<a>), not <button>s. */}
      <Button nativeButton={false} render={<Link href="/auth/sign-up" />}>
        Get started
      </Button>
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link href="/auth/sign-in" />}
      >
        Sign in
      </Button>
    </>
  );
}
