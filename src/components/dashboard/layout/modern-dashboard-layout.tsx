"use client";

import { ReactNode } from "react";
import type { CSSProperties } from "react";
import { cookies } from "next/headers";

import { AppSidebar } from "./app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/stores/preferences/preferences-store";

import { LayoutControls } from "./layout-controls";
import { SearchDialog } from "./search-dialog";
import { ThemeSwitcher } from "./theme-switcher";
import { AccountSwitcher } from "./account-switcher";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ModernDashboardLayoutProps {
  children: ReactNode;
  defaultOpen?: boolean;
}

export function ModernDashboardLayout({ children, defaultOpen }: ModernDashboardLayoutProps) {
  const { sidebarVariant, sidebarCollapsible, contentLayout } = usePreferencesStore();

  return (
    <div className="theme-default theme-scaled">
      <SidebarProvider
        defaultOpen={defaultOpen ?? true}
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties}
      >
        <AppSidebar variant={sidebarVariant} collapsible={sidebarCollapsible} />
        <SidebarInset
          data-content-layout={contentLayout}
          className={cn(
            "data-[content-layout=centered]:!mx-auto data-[content-layout=centered]:max-w-screen-2xl",
            // Adds right margin for inset sidebar in centered layout up to 113rem.
            // On wider screens with collapsed sidebar, removes margin and sets margin auto for alignment.
            "max-[113rem]:peer-data-[variant=inset]:!mr-2 min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto",
          )}
        >
          <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <SearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <LayoutControls />
                <ThemeSwitcher />
                <AccountSwitcher />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="hidden md:inline-flex"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </header>
          <div className="h-full">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
} 