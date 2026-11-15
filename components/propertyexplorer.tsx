"use client";

import { useState } from "react";
import MapView, { type MapViewProps } from "@/components/mapview";
import {
  PropertyPolygons,
  type PropertyPolygonsProps,
} from "@/components/map/property-polygons";
import { PropertyMarkers } from "@/components/map/property-markers";
import { PropertySidebar } from "@/components/map/property-sidebar";
import { type Property } from "@/components/map/property-type";
import { usePropertyDetails } from "@/components/map/use-property-details";

export interface PropertyExplorerProps {
  mapProps: MapViewProps;
  polygonProps: PropertyPolygonsProps;
  properties?: Property[];
}

export default function PropertyExplorer({
  mapProps,
  polygonProps,
  properties,
}: PropertyExplorerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { property, loading } = usePropertyDetails(selectedId, polygonProps);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 h-full min-w-0">
        <MapView {...mapProps}>
          <PropertyPolygons
            {...polygonProps}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              polygonProps.onSelect?.(id);
            }}
          />
          {properties && <PropertyMarkers properties={properties} />}
        </MapView>
      </div>

      <PropertySidebar
        selectedId={selectedId}
        property={property}
        loading={loading}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
