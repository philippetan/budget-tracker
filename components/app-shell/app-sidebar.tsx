import { WalletCardsIcon } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { NavList, NavMain } from "@/components/app-shell/nav-main";
import { UserMenu } from "@/components/app-shell/user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth/server";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <WalletCardsIcon className="size-4" />
              </div>
              <span className="truncate font-semibold">Budget Tracker</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<NavList />}>
          <NavMain />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <Suspense fallback={<UserMenuSkeleton />}>
          <SidebarUser />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

async function SidebarUser() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;

  const { name, email, image } = session.user;
  return <UserMenu name={name} email={email} image={image} />;
}

// Fixed-width placeholder (shadcn's SidebarMenuSkeleton uses Math.random,
// which Cache Components rejects during prerendering).
function UserMenuSkeleton() {
  return (
    <div className="flex h-12 items-center gap-2 px-2">
      <Skeleton className="size-8 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
