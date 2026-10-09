'use client';

import { useState } from 'react';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { BoundaryLayer } from './map/property-boundaries';
import type { Property } from './map/property-type';
import { PropertyMarkers } from './map/property-markers';
import { PropertyPopup } from './map/property-popup';
import { useProperties } from './map/use-properties';

export default function MapView() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { properties } =useProperties();

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ latitude: 47.0379, longitude: -122.9010, zoom: 12 }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: '100%', height: '100%' }}
    >
      <BoundaryLayer visible={true} />
      <PropertyMarkers
        properties={properties}
        selectedId={selectedProperty?.id ?? null}
        onSelectProperty={setSelectedProperty}
      />
       <PropertyPopup
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </Map>
  );
}