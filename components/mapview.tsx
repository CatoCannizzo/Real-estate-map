"use client";

import { useState, useEffect } from "react";
import Map, { Source, Layer, MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BoundaryLayer } from "./map/static-boundaries";
import { ParcelPolygons } from "./map/parcel-polygons";
import type { Property } from "./map/property-type";
import { PropertyMarkers } from "./map/property-markers";
import { PropertyPopup } from "./map/property-popup";
import { useParcels } from "./map/use-parcels";

export default function MapView() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const onClick = (event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (feature) {
      setSelectedParcelId(String(feature.properties?.ID));
    }
  };
  const [hoverParcelId, setHoverParcelId] = useState<string | null>(null);

  const onHover = (event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (feature) {
      setHoverParcelId(String(feature.properties?.ID));
    } else {
      setHoverParcelId(null);
    }
  };
  const [cursor, setCursor] = useState<string>("auto");

  //Now loads data from API
  const { parcels, getParcels, loading, error } = useParcels();

  //Trigger a toast when error occurs on load
  useEffect(() => {
    if (error) {
      toast.error("Failed to load parcels", {
        description: error.message || "An error occurred",
      });
    }
  }, [error]);

  const handleLoadParcels = () => {
    getParcels();
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
          {loading ? "Loading Parcels..." : "Load Parcels"}
        </Button>
        {parcels.length > 0 && (
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur px-2.5 py-1 text-xs border shadow-sm"
          >
            {parcels.length} {parcels.length === 1 ? "parcel" : "parcels"}{" "}
            loaded
          </Badge>
        )}
      </div>

      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ latitude: 40.7484, longitude: -73.9857, zoom: 15 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        interactiveLayerIds={["parcel-boundaries-fill"]}
        style={{ width: "100%", height: "100%" }}
        cursor={cursor}
        onMouseEnter={() => setCursor("pointer")}
        onMouseLeave={() => setCursor("auto")}
        onClick={onClick}
        onMouseMove={onHover}
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
            paint={{ "line-color": "#ff69b4", "line-width": 1 }}
          />
        </Source>{" "}
        <ParcelPolygons
          visible={true}
          selectedId={selectedParcelId}
          hoverId={hoverParcelId}
        />
        <BoundaryLayer visible={true} />
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
