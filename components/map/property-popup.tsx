'use client';

import { Popup } from 'react-map-gl/mapbox';
import type { Property } from './property-type';

interface PropertyPopupProps {
  property: Property | null;
  onClose: () => void;
}

export function PropertyPopup({ property, onClose }: PropertyPopupProps) {
  if (!property) return null;

  return (
    <Popup
      latitude={property.latitude}
      longitude={property.longitude}
      anchor="top"
      onClose={onClose}
      className="text-foreground"
    //   following attributes are my preference
      closeButton={false}
      closeOnClick={true}
      maxWidth="320px"
    >
      <div className="flex flex-col gap-2 p-1">
        <h3 className="font-bold text-base">Property #{property.id}</h3>
        {property.address && (
          <p className="text-xs text-muted-foreground">{property.address}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
        </p>
      </div>
    </Popup>
  );
}