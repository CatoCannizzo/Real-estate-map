"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Search, Bell, BookmarkPlus, CheckCircle2 } from "lucide-react";

import { HouseLogo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar"; // if using sidebar

export function AppHeader() {
  const pathname = usePathname();

  const handleAlertTrigger = () => {
    toast.success("Alert Preferences Activated", {
      description: "You'll receive real-time notifications for price drops and new nearby listings.",
      icon: <CheckCircle2 className="size-4 text-emerald-500" />,
    });
  };

  const handleSaveSearch = () => {
    toast.info("Geographic Search Boundary Saved", {
      description: "Westlake Hills & Central Core filters saved with radius 15 miles.",
      icon: <BookmarkPlus className="size-4 text-primary" />,
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border/80 bg-background/95 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        {/* Optional SidebarTrigger if sidebar is enabled */}
        <SidebarTrigger className="-ml-1" />
        
      </div>

      {/* Navigation Menu */}

      <div className="hidden lg:flex flex-1 justify-center px-6">
        <NavigationMenu>
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link href="/">Dashboard</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
           
          </NavigationMenuList>
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link href="/map">Interactive Map</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
           
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Right Header Actions */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex gap-2 text-xs text-muted-foreground font-normal hover:text-foreground"
          onClick={handleSaveSearch}
        >
          <Search className="size-3.5" />
          <span>Search map area...</span>
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-muted-foreground hover:text-foreground"
          onClick={handleAlertTrigger}
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>

        <Separator orientation="vertical" className="h-4 hidden sm:block" />

        <Avatar size="sm">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            CC
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}