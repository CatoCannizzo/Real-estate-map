// components/map/property-markers.tsx
import React, { useCallback } from "react";
import { Marker } from "react-map-gl/mapbox";
import type { Property } from "./property-type";
import { PropertyPin, PinLabelPosition } from "./property-pin";

interface PropertyMarkersProps {
  properties: Property[];
  selectedId: string | null;
  labelPosition?: PinLabelPosition;
  onSelectProperty: (property: Property) => void;
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
  selectedId,
  labelPosition = "bottom",
  onSelectProperty,
}: PropertyMarkersProps) {
  return (
    <>
      {properties.map((prop) => (
        <PropertyMarkerItem
          key={prop.id}
          property={prop}
          isSelected={selectedId === prop.id}
          labelPosition={labelPosition}
          onSelect={onSelectProperty}
        />
      ))}
    </>
  );
}
