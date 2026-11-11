"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import MapView from "@/components/mapview";
import {
  PropertyPolygons,
  PropertyPolygonsProps,
} from "@/components/map/property-polygons";
import { PropertyMarkers } from "@/components/map/property-markers";
import { useGqlProperties } from "@/components/map/use-gql-properties";

const MANHATTAN_INITIAL_VIEW = {
  latitude: 40.7484,
  longitude: -73.9857,
  zoom: 15,
};

const MANHATTAN_POLYGON_PROPS: PropertyPolygonsProps = {
  sourceType: "vector",
  sourceId: "property-boundaries",
  sourceUrl: "mapbox://svayser.parcel-boundaries",
  sourceLayer: "attom-parcels",
  idProperty: "ID",
  visible: true,
  minZoom: 15.5,
  maxZoom: 20,
};

export default function MapPage() {
  const {
    properties: gqlProperties,
    getProperties,
    loading: isGqlLoading,
    error,
  } = useGqlProperties();

  useEffect(() => {
    if (error) {
      toast.error("Failed to load properties", {
        description: error.message || "An error occurred",
      });
    }
  }, [error]);

  return (
    <div className="flex h-full w-full">
      <MapView
        initialView={MANHATTAN_INITIAL_VIEW}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        loadedCount={gqlProperties.length}
        loading={isGqlLoading}
        onLoadData={() => getProperties()}
      >
        <PropertyPolygons {...MANHATTAN_POLYGON_PROPS} />
        <PropertyMarkers properties={gqlProperties} />
      </MapView>
    </div>
  );
}
