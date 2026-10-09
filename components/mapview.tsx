'use client';

import { useState } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

//Property interface to define the structure of a property object, currently just used for pins and popups
interface Property {
  id: string;
  latitude: number;
  longitude: number;
}

const properties: Property[] = [
  { id: '1', latitude: 47.0379, longitude: -122.9010 },
  { id: '2', latitude: 47.0500, longitude: -122.9000 },
  { id: '3', latitude: 47.0400, longitude: -122.9100 },
];

export default function MapView() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ latitude: 47.0379, longitude: -122.9010, zoom: 12 }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Adding Lacey City Boundary to Map */}
      <Source
        id="city-boundary-source"
        type="geojson"
        data="/tri-cities-boundary.geojson">
          <Layer
            id="city-boundary-fill"
            type="fill"
            paint={{
              'fill-color': [
               'match', ['get', 'JurisdictionName'], 
              'LACEY', '#0284c7', 
              'OLYMPIA', '#16a34a',
              'TUMWATER', '#facc15',
              'transparent' //fallback color for other jurisdictions
              ],
              'fill-opacity': 0.2,
            }}
            />
          {/* Border outline */}
          <Layer
            id="city-boundary-line"
            type="line"
            paint={{
              'line-color': [
              'match',['get', 'JurisdictionName'],
              'OLYMPIA', '#10b981',
              'LACEY', '#0284c7',
              'TUMWATER', '#ebcf31',
              '#6b7280',
            ],
              'line-width': 2,
              'line-dasharray': [2, 1], // Optional: dashed border line
            }}
        />
        </Source>

      {properties.map((prop) => (
        <Marker
          key={prop.id}
          latitude={prop.latitude}
          longitude={prop.longitude}
          anchor="bottom"
          onClick={(e) => {
            // Keep popup from immediately closing when clicking the marker
            e.originalEvent.stopPropagation();
            setSelectedProperty(prop);
          }}
        >
          {/* Custom pin with id as badge */}
          <button className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-md hover:scale-105 transition-transform cursor-pointer border border-white">
            <MapPin className="size-3" />
            <span>{prop.id}</span>
          </button>
        </Marker>
      ))}

      {selectedProperty && (
        <Popup
          latitude={selectedProperty.latitude}
          longitude={selectedProperty.longitude}
          anchor="top"
          onClose={() => setSelectedProperty(null)}
          className="text-foreground"
        >
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Property #{selectedProperty.id}</h3>
            <p className="text-muted-foreground">
              Latitude: {selectedProperty.latitude.toFixed(4)}, Longitude: {selectedProperty.longitude.toFixed(4)}
            </p>
          </div>
        </Popup>
      )}
    </Map>
  );
}