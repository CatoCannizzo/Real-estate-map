// Layer Source: "https://tconline.co.thurston.wa.us/server/rest/services/ThurstonExt/Thurston_Cities/FeatureServer/0/query?where=JurisdictionName+IN+(%27Olympia%27%2C%27Tumwater%27%2C%27Lacey%27)&outFields=*&outSR=4326&f=geojson"
'use client';

import { Source, Layer } from 'react-map-gl/mapbox';

interface BoundaryLayerProps {
  visible?: boolean;
}

export function BoundaryLayer({ visible = true }: BoundaryLayerProps) {
  if (!visible) return null;

  return (
    <Source id="city-boundary-source" type="geojson" data="/tri-cities-boundary.geojson">
      <Layer
        id="city-boundary-fill"
        type="fill"
        paint={{
          'fill-color': [
            'match', ['get', 'JurisdictionName'],
            'LACEY', '#0284c7',
            'OLYMPIA', '#16a34a',
            'TUMWATER', '#facc15',
            'transparent', // fallback color for other jurisdictions
          ],
          'fill-opacity': 0.2,
        }}
      />
      <Layer
        id="city-boundary-line"
        type="line"
        paint={{
          'line-color': [
            'match', ['get', 'JurisdictionName'],
            'OLYMPIA', '#10b981',
            'LACEY', '#0284c7',
            'TUMWATER', '#ebcf31',
            '#6b7280', //fallback
          ],
          'line-width': 2,
          'line-dasharray': [2, 1],
        }}
      />
    </Source>
  );
}