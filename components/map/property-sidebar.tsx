"use client";

import { Building2, MapPin, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PropertySidebarProps {
  selectedId: string | null;
  onClose?: () => void;
}

export function PropertySidebar({ selectedId, onClose }: PropertySidebarProps) {
  return (
    <aside className="w-80 shrink-0 h-full border-l border-border bg-card flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          <h2 className="font-semibold text-sm tracking-tight">
            Property Details
          </h2>
        </div>
        {selectedId && onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Clear selection"
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 p-4">
        {!selectedId ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12 text-muted-foreground space-y-2">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No Property Selected
            </p>
            <p className="text-xs leading-relaxed">
              Click any parcel boundary on the map to inspect its details.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Selected Parcel ID</p>
            <Badge variant="secondary" className="text-xs font-mono">
              {selectedId}
            </Badge>
          </div>
        )}
      </div>
    </aside>
  );
}
