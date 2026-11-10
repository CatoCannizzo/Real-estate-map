import MapView from "@/components/mapview";

export const metadata = {
  title: "EstateMap - Interactive Map",
  description: "Explore properties on an interactive map.",
};

export default function MapPage() {
  return (
    <div className="flex h-full w-full">
      <MapView />
    </div>
  );
}
