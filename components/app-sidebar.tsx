"use client";

import * as React from "react";
import {
  MapPin,
  Building,
  Compass,
  TrendingUp,
  SlidersHorizontal,
  Home,
  BedDouble,
  GraduationCap,
  Bookmark,
  BellRing,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HouseLogo } from "@/components/logo";
import Link from "next/link";
import {usePathname} from "next/navigation";


export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border/60 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-accent">
              <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HouseLogo size={24} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold tracking-tight">EstateMap</span>
                <span className="truncate text-xs text-muted-foreground">Geospatial Explorer</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground/80">
            Discovery
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/map" />} isActive={pathname === "/map"} tooltip="Interactive Map">
                  <MapPin className="size-4 text-primary" />
                  <span>Interactive Map</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Featured Properties">
                  <Building className="size-4" />
                  <span>Featured Properties</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Neighborhood Insights">
                  <Compass className="size-4" />
                  <span>Neighborhoods</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Market Trends">
                  <TrendingUp className="size-4" />
                  <span>Market Trends</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-1" />

        {/* Filter Preview Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground/80">
            Map Filters (Preview)
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Price Range">
                  <SlidersHorizontal className="size-4" />
                  <span>Price Range</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Property Type">
                  <Home className="size-4" />
                  <span>Property Type</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Beds & Baths">
                  <BedDouble className="size-4" />
                  <span>Beds & Baths</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Schools & Transit">
                  <GraduationCap className="size-4" />
                  <span>School Ratings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-1" />

        {/* Saved Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground/80">
            Activity
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Saved Homes">
                  <Bookmark className="size-4" />
                  <span>Saved Homes</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="text-xs bg-primary/10 text-primary">4</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Search Alerts">
                  <BellRing className="size-4" />
                  <span>Active Alerts</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  New
                </SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-accent">
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  CC
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-medium">Cato Cannizzo</span>
                <span className="truncate text-muted-foreground">Admin / Developer</span>
              </div>
              <Settings className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
