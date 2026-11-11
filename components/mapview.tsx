"use client";

import Map, { Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface MapViewProps {
  initialView: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  mapboxAccessToken?: string;
  loadedCount?: number;
  loading?: boolean;
  onLoadData?: () => void;
  children?: React.ReactNode;
}

export default function MapView({
  initialView,
  mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  loadedCount = 0,
  loading = false,
  onLoadData,
  children,
}: MapViewProps) {
  return (
    <div className="relative w-full h-full">
      {/* Floating action bar on top of the map */}
      {onLoadData && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <Button
            onClick={onLoadData}
            disabled={loading}
            className="shadow-md cursor-pointer"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Loading Properties..." : "Load Properties"}
          </Button>
          {loadedCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-background/80 backdrop-blur px-2.5 py-1 text-xs border shadow-sm"
            >
              {loadedCount} {loadedCount === 1 ? "property" : "properties"}{" "}
              loaded
            </Badge>
          )}
        </div>
      )}

      <Map
        mapboxAccessToken={mapboxAccessToken}
        initialViewState={initialView}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
      >
        <Source
          id="mapbox-terrain"
          type="vector"
          url="mapbox://mapbox.mapbox-terrain-v2"
        >
          <Layer
            id="terrain-data"
            type="line"
            source-layer="contour"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": "#9c5707",
              "line-width": 1,
              "line-opacity": 0.3,
            }}
          />
        </Source>
        {children}
      </Map>
    </div>
  );
}
