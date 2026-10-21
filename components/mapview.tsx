'use client';

import { useState } from 'react';
import Map, {Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BoundaryLayer } from './map/property-boundaries';
import type { Property } from './map/property-type';
import { PropertyMarkers } from './map/property-markers';
import { PropertyPopup } from './map/property-popup';
import { useParcels } from './map/use-parcels';

export default function MapView() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  //Now loads data from API
  const { parcels, getParcels, loading, error } = useParcels();

  //Trigger a toast when error occurs on load
  const handleLoadParcels = async () => {
    try {
      await getParcels();
    } catch (err) {
      toast.error('Failed to load parcels', {
        description: err instanceof Error ? err.message : 'An error occurred',
      });
    }
  };

  return (
     <div className="relative w-full h-full">
      {/* 3. Floating action bar on top of the map */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Button
          onClick={handleLoadParcels}
          disabled={loading}
          className="shadow-md cursor-pointer"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Loading Parcels...' : 'Load Parcels'}
        </Button>
        {parcels.length > 0 && (
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur px-2.5 py-1 text-xs border shadow-sm"
          >
            {parcels.length} {parcels.length === 1 ? 'parcel' : 'parcels'} loaded
          </Badge>
        )}
      </div>

    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ latitude: 47.0379, longitude: -122.9010, zoom: 12 }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: '100%', height: '100%' }}
    >
      <Source id="mapbox-terrain" type="vector" url="mapbox://mapbox.mapbox-terrain-v2">
        <Layer
          id="terrain-data"
          type="line"
          source-layer="contour"
          layout={{ 'line-join': 'round', 'line-cap': 'round' }}
          paint={{ 'line-color': '#ff69b4', 'line-width': 1 }}
        />
      </Source>      <BoundaryLayer visible={true} />
      <PropertyMarkers
          properties={parcels}
          selectedId={selectedProperty?.id ?? null}
          onSelectProperty={setSelectedProperty}
        />
       <PropertyPopup
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </Map>
    </div>
  );
}