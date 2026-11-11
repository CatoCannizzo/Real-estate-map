"use client";

import MapView from "@/components/mapview";

const UW_INITIAL_VIEW = {
  latitude: 47.6553,
  longitude: -122.3035,
  zoom: 15,
};

export default function WaMapPage() {
  return (
    <div className="flex h-full w-full">
      <MapView
        initialView={UW_INITIAL_VIEW}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      />
    </div>
  );
}
