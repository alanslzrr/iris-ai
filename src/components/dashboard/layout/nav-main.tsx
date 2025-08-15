"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PlusCircleIcon, MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { type NavGroup, type NavMainItem } from "@/navigation/sidebar/sidebar-items";

interface NavMainProps {
  readonly items: readonly NavGroup[];
}

const IsComingSoon = () => (
  <span className="ml-auto rounded-md bg-sidebar-primary px-2 py-0.5 text-[10px] tracking-wide text-sidebar-primary-foreground">
    Soon
  </span>
);

const IsNew = () => (
  <span className="ml-auto text-[10px] tracking-wide text-foreground/80">
    New!
  </span>
);

export function NavMain({ items }: NavMainProps) {
  const path = usePathname();
  const { state, isMobile } = useSidebar();

  const isItemActive = (url: string) => {
    // Ensure overview ("/dashboard") is only active on the exact route
    if (url === "/dashboard") return path === "/dashboard";
    // For nested items, allow exact match or any nested sub-route
    return path === url || path.startsWith(`${url}/`);
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 active:bg-sidebar-primary/95 min-w-8 duration-200 ease-linear"
              >
                <PlusCircleIcon />
                <span>Quick Create</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
              >
                <MailIcon />
                <span className="sr-only">Inbox</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {items.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    aria-disabled={item.comingSoon}
                    tooltip={item.title}
                    isActive={isItemActive(item.url)}
                  >
                    <Link href={item.url} target={item.newTab ? "_blank" : undefined}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      {item.comingSoon && <IsComingSoon />}
                      {item.isNew && <IsNew />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
} 