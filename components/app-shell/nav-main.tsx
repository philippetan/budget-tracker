"use client";

import {
  ArrowLeftRightIcon,
  LayoutDashboardIcon,
  PiggyBankIcon,
  TagsIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRightIcon },
  { title: "Accounts", href: "/accounts", icon: WalletIcon },
  { title: "Categories", href: "/categories", icon: TagsIcon },
  { title: "Budgets", href: "/budgets", icon: PiggyBankIcon },
] as const;

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Nav links. Without `pathname` (while it's loading) nothing is highlighted. */
export function NavList({ pathname }: { pathname?: string | null }) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={isActive(pathname ?? null, item.href)}
                tooltip={item.title}
                render={<Link href={item.href} />}
                // On phones the sidebar is a drawer: close it after navigating.
                onClick={() => isMobile && setOpenMobile(false)}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/** Nav links with the current page highlighted. Render inside <Suspense>. */
export function NavMain() {
  const pathname = usePathname();
  return <NavList pathname={pathname} />;
}
