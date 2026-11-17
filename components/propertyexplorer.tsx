"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import type { MapRef } from "react-map-gl/mapbox";
import MapView, { type MapViewProps } from "@/components/mapview";
import SearchBar from "@/components/search-bar";
import {
  PropertyPolygons,
  type PropertyPolygonsProps,
} from "@/components/map/property-polygons";
import { PropertyMarkers } from "@/components/map/property-markers";
import { PropertySidebar } from "@/components/map/property-sidebar";
import { type Property } from "@/components/map/property-type";
import { usePropertyDetails } from "@/components/map/use-property-details";
import { useGqlAddressSearch } from "@/components/map/use-gql-address-search";
import type { AddressSearchItem } from "@/lib/graphql/queries";

/**
 * Props for the {@link PropertyExplorer} component.
 *
 * @property mapProps - Configuration and event callbacks for the base MapView.
 * @property polygonProps - Layer configuration and selection handler for parcel boundaries.
 * @property properties - Optional array of property points/markers to render on the map.
 */ export interface PropertyExplorerProps {
  mapProps: MapViewProps;
  polygonProps: PropertyPolygonsProps;
  properties?: Property[];
}
/**
 * Main coordinator component managing real estate map exploration.
 * Integrates address search autocomplete, Mapbox polygon layer interaction,
 * camera navigation, and the property details sidebar.
 */
export default function PropertyExplorer({
  mapProps,
  polygonProps,
  properties,
}: PropertyExplorerProps) {
  // Tracks state for the currently selected parcel ID
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // State for the search query input
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<MapRef>(null);
  // Selects parcel details whenever a new parcel ID is updated
  const {
    property,
    loading: propertyLoading,
    error: propertyError,
  } = usePropertyDetails(selectedId, polygonProps);
  // Shows suggested autocomplete addresses based on the search query and handles selection
  const {
    addresses,
    searchAddress,
    debouncedSearch,
    loading: addressLoading,
    error: searchError,
  } = useGqlAddressSearch();

  // Handles error on address search from GraphQL and displays a toast notification
  useEffect(() => {
    if (searchError) {
      console.error("[GraphQL Address Search Error]:", searchError);
      toast.error("Address search unavailable", {
        description:
          "We're having trouble reaching the search service. Please try again shortly.",
      });
    }
  }, [searchError]);

  // Handles error on retrieving property details from GraphQL and displays a toast notification
  useEffect(() => {
    if (propertyError) {
      console.error("[GraphQL Property Details Error]:", propertyError);
      toast.error("Property details unavailable", {
        description:
          "Could not load details for this parcel. Please try selecting it again.",
      });
    }
  }, [propertyError]);
  /**
   * Handles user selection of an address suggestion from the search dropdown:
   * updates the search input, selects the parcel ID, syncs with polygon layers,
   * and animates the map camera to the target coordinates.
   *
   * @param item - The selected address item containing coordinate and parcel data.
   */
  const handleSelectAddress = (item: AddressSearchItem) => {
    setSearchQuery(item.address_line1);
    setSelectedId(item.parcel_id);
    polygonProps.onSelect?.(item.parcel_id);
    mapRef.current?.flyTo({
      center: [item.lon, item.lat],
      zoom: 17,
      duration: 2000,
    });
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="relative flex-1 h-full min-w-0">
        {/* A search bar that defaults to right side to prevent overlap 
        with deprecated load button that retrieves some property data */}
        <div className="absolute z-20 top-16 left-4 right-4 sm:top-4 sm:left-auto sm:right-4 sm:w-80 max-w-sm">
          <SearchBar
            value={searchQuery}
            items={addresses}
            loading={addressLoading}
            error={searchError}
            placeholder="Search address..."
            onSearch={searchAddress}
            onChange={(value) => {
              setSearchQuery(value);
              debouncedSearch(value);
            }}
            onSelectItem={handleSelectAddress}
            onClear={() => setSearchQuery("")}
          />
        </div>

        {/* Interactive canvas, that takes the mapRef for fly to 
        and anything to be rendered in mapbox */}
        <MapView mapRef={mapRef} {...mapProps}>
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
      {/* Property Sidebar showcases a list of self hidding info divs */}
      <PropertySidebar
        selectedId={selectedId}
        property={property}
        loading={propertyLoading}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
