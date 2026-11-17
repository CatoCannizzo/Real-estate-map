"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import type { AddressSearchItem } from "@/lib/graphql/parcels";

export interface PropertyExplorerProps {
  mapProps: MapViewProps;
  polygonProps: PropertyPolygonsProps;
  properties?: Property[];
}

export default function PropertyExplorer({
  mapProps,
  polygonProps,
  properties,
}: PropertyExplorerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    property,
    loading: propertyLoading,
    error: propertyError,
  } = usePropertyDetails(selectedId, polygonProps);
  const {
    addresses,
    searchAddress,
    debouncedSearch,
    loading: addressLoading,
    error: searchError,
  } = useGqlAddressSearch();

  useEffect(() => {
    if (searchError) {
      console.error("[GraphQL Address Search Error]:", searchError);
      toast.error("Address search unavailable", {
        description:
          "We're having trouble reaching the search service. Please try again shortly.",
      });
    }
  }, [searchError]);

  useEffect(() => {
    if (propertyError) {
      console.error("[GraphQL Property Details Error]:", propertyError);
      toast.error("Property details unavailable", {
        description:
          "Could not load details for this parcel. Please try selecting it again.",
      });
    }
  }, [propertyError]);

  const handleSelectAddress = (item: AddressSearchItem) => {
    setSearchQuery(item.address_line1);
    setSelectedId(item.parcel_id);
    polygonProps.onSelect?.(item.parcel_id);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="relative flex-1 h-full min-w-0">
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

        <MapView {...mapProps}>
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

      <PropertySidebar
        selectedId={selectedId}
        property={property}
        loading={propertyLoading}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
