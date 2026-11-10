"use client";

import { Source, Layer } from "react-map-gl/mapbox";
// import type { FillLayerSpecification, LineLayerSpecification } from "mapbox-gl";

interface ParcelPolygonsProps {
  // sourceID?: string;
  // sourceURL: string;
  hoverId?: string | null;
  selectedId?: string | null;
  visible?: boolean;
  // minzoom?: number;
  // maxzoom?: number;
  // beforeId?: string;
  // beforeId?: string;
  // fillPaint?: FillLayerSpecification["paint"];
  // linePaint?: LineLayerSpecification["paint"];
}

export function ParcelPolygons({
  visible = true,
  // minzoom = 0,
  // maxzoom = 16,
  selectedId,
  hoverId,
  // beforeId = "bottom"
}: ParcelPolygonsProps) {
  if (!visible) return null;

  return (
    <Source
      id="parcel-boundaries-source"
      type="vector"
      url="mapbox://svayser.parcel-boundaries"
    >
      <Layer
        id="parcel-boundaries-fill"
        source-layer="attom-parcels"
        type="fill"
        // Paint uses selectedId to determine fill color for selected parcel
        paint={{
          "fill-color": [
            "case",
            ["==", ["to-string", ["get", "ID"]], selectedId ?? ""],
            "#ff641c",
            ["==", ["to-string", ["get", "ID"]], hoverId ?? ""],
            "#ffdd1c",

            "#fff098",
          ],
          "fill-opacity": [
            "case",
            ["==", ["to-string", ["get", "ID"]], selectedId ?? ""],
            0.8,
            ["==", ["to-string", ["get", "ID"]], hoverId ?? ""],
            0.8,
            0.3,
          ],
        }}
      />
      <Layer
        source-layer="attom-parcels"
        id="parcel-boundaries-line"
        type="line"
        paint={{
          "line-color": "#000000",
          "line-width": 1,
          "line-opacity": 0.5,
        }}
      />
    </Source>
  );
}
