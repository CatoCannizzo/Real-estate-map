"use client";

import MapView from "@/components/mapview";
import {
  PropertyPolygons,
  PropertyPolygonsProps,
} from "@/components/map/property-polygons";

const UW_INITIAL_VIEW = {
  latitude: 47.6553,
  longitude: -122.3035,
  zoom: 15,
};

const UW_POLYGON_PROPS: PropertyPolygonsProps = {
  sourceType: "geojson",
  sourceId: "uw-parcels",
  data: "/sampleData/seattle-udistrict-sample.geojson",
  idProperty: "pin",
  minZoom: 10,
};

export default function WaMapPage() {
  return (
    <div className="flex h-full w-full">
      <MapView
        initialView={UW_INITIAL_VIEW}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        <PropertyPolygons {...UW_POLYGON_PROPS} />
      </MapView>
    </div>
  );
}
