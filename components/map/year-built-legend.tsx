"use client";

import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface YearBuiltLegendProps {
  /** Whether the year built choropleth layer mode is currently active */
  active: boolean;
  /** Callback fired to toggle the choropleth mode on or off */
  onToggle: (active: boolean) => void;
}

/**
 * Floating map overlay providing a toggle between standard parcel styling and
 * the year-built choropleth, plus a visual color scale legend (1900 to 2025).
 */
export function YearBuiltLegend({ active, onToggle }: YearBuiltLegendProps) {
  return (
    <div className="bg-background/90 backdrop-blur-md rounded-lg border shadow-lg p-3 text-xs w-64 space-y-2.5 transition-all">
      {/* Toggle header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Year Built Choropleth</span>
        </div>
        <Button
          type="button"
          size="sm"
          variant={active ? "default" : "outline"}
          className="h-6 px-2 text-[11px] cursor-pointer"
          onClick={() => onToggle(!active)}
        >
          {active ? "Active" : "Off"}
        </Button>
      </div>

      {/* Visual legend details when choropleth is active */}
      {active && (
        <div className="space-y-2 pt-1 border-t border-border/60">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>≤ 1900</span>
              <span>1960</span>
              <span>2025+</span>
            </div>
            {/* Color ramp gradient */}
            <div
              className="h-2.5 w-full rounded-sm shadow-inner"
              style={{
                background:
                  "linear-gradient(to right, #fde0dd, #fa9fb5, #dd3497, #7a0177)",
              }}
            />
          </div>

          {/* Fallback & interaction swatches */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#cccccc] border border-border/40 inline-block" />
              <span>No data</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#0be603] inline-block" />
              <span>Selected</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
