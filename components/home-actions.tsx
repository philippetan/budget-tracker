"use client";

import { useAuth, useSession } from "@better-auth-ui/react";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Sign-up / sign-in buttons for the public pages, or "Go to dashboard" for
 * signed-in visitors. The session is checked in the browser so the pages
 * themselves stay static (fast, and cacheable).
 */
export function HomeActions({
  placement = "hero",
}: {
  /** "header": compact buttons for the top bar. "hero": large call to action. */
  placement?: "header" | "hero";
}) {
  const { authClient } = useAuth();
  const { data: session } = useSession(authClient);
  const size = placement === "hero" ? "lg" : "default";

  // nativeButton={false}: these render as links (<a>), not <button>s.
  if (session?.user) {
    return (
      <Button size={size} nativeButton={false} render={<Link href="/dashboard" />}>
        Go to dashboard
        <ArrowRightIcon />
      </Button>
    );
  }

  if (placement === "header") {
    return (
      <>
        {/* Hidden on very narrow phones; the hero has its own Sign in button. */}
        <Button
          variant="ghost"
          className="hidden min-[400px]:inline-flex"
          nativeButton={false}
          render={<Link href="/auth/sign-in" />}
        >
          Sign in
        </Button>
        <Button nativeButton={false} render={<Link href="/auth/sign-up" />}>
          Get started
        </Button>
      </>
    );
  }

  return (
    <>
      <Button size="lg" nativeButton={false} render={<Link href="/auth/sign-up" />}>
        Create your account
        <ArrowRightIcon />
      </Button>
      <Button
        size="lg"
        variant="outline"
        nativeButton={false}
        render={<Link href="/auth/sign-in" />}
      >
        Sign in
      </Button>
    </>
  );
}
