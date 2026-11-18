"use client";

import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type UserMenuProps = {
  name: string;
  email: string;
  image?: string | null;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "?"
  );
}

function UserAvatar({ name, image }: Pick<UserMenuProps, "name" | "image">) {
  return (
    <Avatar className="size-8 rounded-lg">
      {image ? <AvatarImage src={image} alt={name} /> : null}
      <AvatarFallback className="rounded-lg">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

function UserDetails({ name, email }: Pick<UserMenuProps, "name" | "email">) {
  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">{name}</span>
      <span className="truncate text-xs text-muted-foreground">{email}</span>
    </div>
  );
}

export function UserMenu({ name, email, image }: UserMenuProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <UserAvatar name={name} image={image} />
            <UserDetails name={name} email={email} />
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <div className="flex items-center gap-2 px-1 py-1.5">
              <UserAvatar name={name} image={image} />
              <UserDetails name={name} email={email} />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/auth/sign-out")}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
