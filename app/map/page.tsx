"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import PropertyExplorer from "@/components/propertyexplorer";
import { type MapViewProps } from "@/components/mapview";
import { type PropertyPolygonsProps } from "@/components/map/property-polygons";
import { useGqlProperties } from "@/components/map/use-gql-properties";

// Center map on Midtown Manhattan around the Empire State Building
const MANHATTAN_INITIAL_VIEW = {
  latitude: 40.7484,
  longitude: -73.9857,
  zoom: 15,
};

// Vector tile configuration for NYC parcel boundaries (Attom data hosted on Mapbox)
const MANHATTAN_POLYGON_PROPS: PropertyPolygonsProps = {
  sourceType: "vector",
  sourceId: "property-boundaries",
  sourceUrl: "mapbox://svayser.parcel-boundaries",
  sourceLayer: "attom-parcels",
  idProperty: "ID",
  visible: true,
  minZoom: 10,
  maxZoom: 20,
};

/**
 * Manhattan / NYC Map Route:
 * Loads vector parcel polygons and queries Reonomy property data via GraphQL.
 */
export default function MapPage() {
  // Hook to fetch batch property markers from the GraphQL backend
  const {
    properties: gqlProperties,
    getProperties,
    loading: isGqlLoading,
    error,
  } = useGqlProperties();

  // Handles error when loading property markers from GraphQL and displays a toast notification
  useEffect(() => {
    if (error) {
      console.error("[GraphQL Properties Load Error]:", error);
      toast.error("Unable to load properties", {
        description:
          "We couldn't retrieve the property data right now. Please try again shortly.",
      });
    }
  }, [error]);

  // Map settings including center coords, token, and the load properties button handler
  const mapviewProps: MapViewProps = {
    initialView: MANHATTAN_INITIAL_VIEW,
    mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    loadedCount: gqlProperties.length,
    loading: isGqlLoading,
    onLoadData: () => getProperties(),
  };

  return (
    <div className="h-full w-full">
      <PropertyExplorer
        mapProps={mapviewProps}
        polygonProps={MANHATTAN_POLYGON_PROPS}
        properties={gqlProperties}
      />
    </div>
  );
}
