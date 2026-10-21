"use client";

import React from "react";
import { MapPin } from "lucide-react";

export type PinLabelPosition = "bottom" | "side" | "right" | "left" | "top";

export interface PropertyPinProps {
  id: string;
  name?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  labelPosition?: PinLabelPosition;
  showLabel?: boolean;
  className?: string;
  onClick: () => void;
}

const labelPositionStyles: Record<PinLabelPosition, string> = {
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
  side: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
};

export const PropertyPin = React.memo(function PropertyPin({
  id,
  name,
  isSelected,
  isHovered,
  labelPosition = "bottom",
  showLabel = true,
  className = "",
  onClick,
}: PropertyPinProps) {
  const displayName = name || id;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`group relative flex items-center justify-center size-7 rounded-full cursor-pointer select-none border-2 border-white shadow-md transition-all ${
        isSelected
          ? "bg-amber-500 text-white ring-2 ring-amber-400 scale-110 z-30"
          : isHovered
            ? "bg-primary text-primary-foreground scale-110 z-20"
            : "bg-primary text-primary-foreground hover:scale-110 z-10"
      } ${className}`}
      aria-label={`Property ${displayName}`}
    >
      <MapPin className="size-3.5 shrink-0" />

      {showLabel && (
        <span
          className={`absolute whitespace-nowrap max-w-[160px] truncate text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-md border transition-all pointer-events-auto ${labelPositionStyles[labelPosition]} ${
            isSelected
              ? "bg-amber-500 text-white border-amber-300 ring-1 ring-amber-400 z-30"
              : "bg-background/95 text-foreground border-border/80 backdrop-blur-xs group-hover:border-primary/50 group-hover:bg-background z-20"
          }`}
        >
          {displayName}
        </span>
      )}
    </button>
  );
});
