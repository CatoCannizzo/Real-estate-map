// components/map/markers/property-markers.tsx
'use client';

import { Marker } from 'react-map-gl/mapbox';
import type { Property } from './property-type';
import { PropertyPin } from './property-pin';

interface PropertyMarkersProps {
  properties: Property[];
  selectedId: string | null;
  onSelectProperty: (property: Property) => void;
}

export function PropertyMarkers({
  properties,
  selectedId,
  onSelectProperty,
}: PropertyMarkersProps) {
  return (
    <>
      {properties.map((prop) => (
        <Marker
          key={prop.id}
          latitude={prop.latitude}
          longitude={prop.longitude}
          anchor="bottom"
        >
          <PropertyPin
            id={prop.id}
            isSelected={selectedId === prop.id}
            onClick={() => onSelectProperty(prop)}
          />
        </Marker>
      ))}
    </>
  );
}