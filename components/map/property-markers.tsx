"use client";

import React, { useState, useCallback } from "react";
import { Marker } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import type { Property } from "./property-type";
import { PropertyPopup } from "./property-popup";

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
              ? "hidden"
              : "bg-background/95 text-foreground border-amber-500 border-border/80 backdrop-blur-xs group-hover:border-primary/50 group-hover:bg-background z-20"
          }`}
        >
          {displayName}
        </span>
      )}
    </button>
  );
});

export interface PropertyMarkersProps {
  properties: Property[];
  selectedId?: string | null;
  labelPosition?: PinLabelPosition;
  showPopup?: boolean;
  onSelectProperty?: (property: Property | null) => void;
}

// Memoized individual marker item
const PropertyMarkerItem = React.memo(function PropertyMarkerItem({
  property,
  isSelected,
  labelPosition,
  onSelect,
}: {
  property: Property;
  isSelected: boolean;
  labelPosition?: PinLabelPosition;
  onSelect: (property: Property) => void;
}) {
  const handleClick = useCallback(() => {
    onSelect(property);
  }, [onSelect, property]);

  return (
    <Marker
      latitude={property.latitude}
      longitude={property.longitude}
      anchor="center"
      style={{ zIndex: isSelected ? 30 : 10 }}
    >
      <PropertyPin
        id={property.id}
        isSelected={isSelected}
        labelPosition={labelPosition}
        onClick={handleClick}
      />
    </Marker>
  );
});

export function PropertyMarkers({
  properties,
  selectedId: externalSelectedId,
  labelPosition = "bottom",
  showPopup = true,
  onSelectProperty,
}: PropertyMarkersProps) {
  const [internalSelectedProperty, setInternalSelectedProperty] =
    useState<Property | null>(null);

  const isControlled = externalSelectedId !== undefined;
  const activeSelectedId = isControlled
    ? externalSelectedId
    : (internalSelectedProperty?.id ?? null);

  const activeSelectedProperty = isControlled
    ? (properties.find((p) => p.id === externalSelectedId) ?? null)
    : internalSelectedProperty;

  const handleSelect = useCallback(
    (property: Property) => {
      if (!isControlled) {
        setInternalSelectedProperty(property);
      }
      onSelectProperty?.(property);
    },
    [isControlled, onSelectProperty],
  );

  const handleClosePopup = useCallback(() => {
    if (!isControlled) {
      setInternalSelectedProperty(null);
    }
    onSelectProperty?.(null);
  }, [isControlled, onSelectProperty]);

  return (
    <>
      {properties.map((prop) => (
        <PropertyMarkerItem
          key={prop.id}
          property={prop}
          isSelected={activeSelectedId === prop.id}
          labelPosition={labelPosition}
          onSelect={handleSelect}
        />
      ))}
      {showPopup && (
        <PropertyPopup
          property={activeSelectedProperty}
          onClose={handleClosePopup}
        />
      )}
    </>
  );
}
