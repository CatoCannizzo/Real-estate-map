import fs from "fs";
import path from "path";
import type { FeatureCollection } from "geojson";
import PropertyExplorer from "@/components/propertyexplorer";
import { type MapViewProps } from "@/components/mapview";
import { type PropertyPolygonsProps } from "@/components/map/property-polygons";

const UW_INITIAL_VIEW = {
  latitude: 47.6553,
  longitude: -122.3035,
  zoom: 15,
};

const seattleGeoJsonPath = path.join(
  process.cwd(),
  "public/sampleData/seattle-udistrict-sample.geojson",
);
const seattleGeoJsonData = JSON.parse(
  fs.readFileSync(seattleGeoJsonPath, "utf-8"),
) as FeatureCollection;

const UW_POLYGON_PROPS: PropertyPolygonsProps = {
  sourceType: "geojson",
  sourceId: "uw-parcels",
  data: seattleGeoJsonData,
  idProperty: "pin",
  minZoom: 10,
};

export default function WaMapPage() {
  const mapviewProps: MapViewProps = {
    initialView: UW_INITIAL_VIEW,
    mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  };

  return (
    <div className="h-full w-full">
      <PropertyExplorer
        mapProps={mapviewProps}
        polygonProps={UW_POLYGON_PROPS}
      />
    </div>
  );
}
