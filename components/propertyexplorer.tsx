"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";
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
import { YearBuiltLegend } from "@/components/map/year-built-legend";
import { type Property } from "@/components/map/property-type";
import { usePropertyDetails } from "@/components/map/use-property-details";
import { useGqlAddressSearch } from "@/components/map/use-gql-address-search";
import type { AddressSearchItem } from "@/lib/graphql/queries";

const POPSTATE_DEBOUNCE_MS = 300;

/**
 *  Helper outside the component to subscribe to browser URL changes
 * */
function subscribeToUrl(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

/**
 * Reads and normalizes the `?id=` parcel query parameter from the current browser URL.
 */
export function getParcelIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("id")?.trim();
  return raw ? raw : null;
}

/**
 * Synchronizes the active parcel ID to the browser URL `?id=` query parameter
 * via `window.history.pushState` without reloading the page or pushing duplicate entries.
 */
export function syncParcelIdToUrl(id: string | null): void {
  if (typeof window === "undefined") return;
  const normalizedId = id?.trim() || null;
  if (getParcelIdFromUrl() === normalizedId) return;

  const url = new URL(window.location.href);
  if (normalizedId !== null) {
    url.searchParams.set("id", normalizedId);
  } else {
    url.searchParams.delete("id");
  }
  window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

/**
 * Checks whether a resolved `Property` record has finite, non-zero coordinates suitable for `flyTo`.
 */
function hasValidCoordinates(
  property: Property | null | undefined,
): property is Property {
  if (!property) return false;
  const { latitude, longitude } = property;
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    (latitude !== 0 || longitude !== 0)
  );
}

/**
 * Props for the {@link PropertyExplorer} component.
 *
 * @property mapProps - Configuration and event callbacks for the base MapView.
 * @property polygonProps - Layer configuration and selection handler for parcel boundaries.
 * @property properties - Optional array of property points/markers to render on the map.
 */
export interface PropertyExplorerProps {
  mapProps: Omit<MapViewProps, "mapRef" | "onLoad">;
  polygonProps: PropertyPolygonsProps;
  properties?: Property[];
}

/**
 * Main coordinator component managing real estate map exploration.
 * Integrates address search autocomplete, Mapbox polygon layer interaction,
 * URL query parameter (`?id=`) persistence, camera navigation, and the property details sidebar.
 */
export default function PropertyExplorer({
  mapProps,
  polygonProps,
  properties,
}: PropertyExplorerProps) {
  // Safely reads URL on client after hydration, returns null on server
  const urlParcelId = useSyncExternalStore(
    subscribeToUrl,
    getParcelIdFromUrl,
    () => null, // Server snapshot for SSR match
  );

  // Tracks state for the currently selected parcel ID (initialized to null for SSR/hydration match)
  const [selectedId, setSelectedId] = useState<string | null>(urlParcelId);
  const prevUrlIdRef = useRef<string | null>(urlParcelId);
  // Controls whether parcel polygons are colored by year built (choropleth)
  const [colorByYearBuilt, setColorByYearBuilt] = useState(false);
  // State for the search query input
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<MapRef>(null);
  // Tracks parcel IDs that should trigger a camera flyTo once coordinates resolve
  const pendingFlyToIdRef = useRef<string | null>(urlParcelId);
  // Holds active 300ms debounce timer for rapid browser Back/Forward (popstate) navigation
  const popstateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // Keeps latest polygonProps.onSelect callback accessible inside mount/popstate effects
  const onSelectPropRef = useRef(polygonProps.onSelect);
  // Tracks when the map is loaded for proper id fly to
  const [mapLoaded, setMapLoaded] = useState(false);

  // 1. Handle initial mount side effects once
  useEffect(() => {
    if (urlParcelId !== null) {
      pendingFlyToIdRef.current = urlParcelId;
      onSelectPropRef.current?.(urlParcelId);
    }
    // eslint-disable-next-line
  }, []);

  const clearPendingPopstate = () => {
    if (popstateDebounceRef.current !== null) {
      clearTimeout(popstateDebounceRef.current);
      popstateDebounceRef.current = null;
    }
  };

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
  useEffect(() => {
    onSelectPropRef.current = polygonProps.onSelect;
  }, [polygonProps.onSelect]);

  // Handle 300ms-debounced browser Back/Forward navigation
  useEffect(() => {
    // Skip initial mount since useState(urlParcelId) already handled it
    if (urlParcelId === prevUrlIdRef.current) return;
    prevUrlIdRef.current = urlParcelId;

    clearPendingPopstate();
    popstateDebounceRef.current = setTimeout(() => {
      popstateDebounceRef.current = null;
      pendingFlyToIdRef.current = urlParcelId;
      setSelectedId(urlParcelId);
      onSelectPropRef.current?.(urlParcelId);
    }, POPSTATE_DEBOUNCE_MS);

    return () => clearPendingPopstate();
  }, [urlParcelId]);

  // Executes pending camera flyTo once coordinates resolve, or warns when URL parcel ID cannot be located
  useEffect(() => {
    if (!selectedId || pendingFlyToIdRef.current !== selectedId) return;
    if (propertyLoading || !mapLoaded || !mapRef.current) return;

    if (property && property.id === selectedId) {
      pendingFlyToIdRef.current = null;
      if (hasValidCoordinates(property)) {
        mapRef.current?.flyTo({
          center: [property.longitude, property.latitude],
          zoom: 17,
          duration: 2000,
        });
      } else {
        toast.warning("Parcel location unavailable", {
          description: `Coordinates are unavailable for parcel "${selectedId}". Showing default map view.`,
        });
      }
      return;
    }

    if (!property) {
      pendingFlyToIdRef.current = null;
      if (!propertyError) {
        toast.warning("Parcel not found", {
          description: `No coordinates or property records were found for parcel "${selectedId}". Showing default map view.`,
        });
      }
    }
  }, [selectedId, property, propertyLoading, propertyError, mapLoaded]);

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
   * updates the search input, persists `?id=` in the URL, selects the parcel ID,
   * and schedules a camera flight once property coordinates resolve.
   *
   * @param item - The selected address item containing coordinate and parcel data.
   */
  const handleSelectAddress = (item: AddressSearchItem) => {
    clearPendingPopstate();
    setSearchQuery(item.address_line1);
    syncParcelIdToUrl(item.parcel_id);
    polygonProps.onSelect?.(item.parcel_id);

    if (
      selectedId === item.parcel_id &&
      !propertyLoading &&
      property?.id === item.parcel_id &&
      hasValidCoordinates(property)
    ) {
      pendingFlyToIdRef.current = null;
      mapRef.current?.flyTo({
        center: [property.longitude, property.latitude],
        zoom: 17,
        duration: 2000,
      });
      return;
    }

    pendingFlyToIdRef.current = item.parcel_id;
    setSelectedId(item.parcel_id);
  };

  /**
   * Handles direct parcel polygon clicks on the map canvas:
   * updates selection state and `?id=` URL parameter while keeping the map camera stationary.
   */
  const handlePolygonSelect = (id: string | null) => {
    clearPendingPopstate();
    pendingFlyToIdRef.current = null;
    prevUrlIdRef.current = id; // Keeps ref in sync with pushState
    setSelectedId(id);
    syncParcelIdToUrl(id);
    polygonProps.onSelect?.(id);
  };

  /**
   * Clears the active parcel selection and removes `?id=` from the URL without moving the camera.
   */
  const handleClearSelection = () => {
    clearPendingPopstate();
    pendingFlyToIdRef.current = null;
    prevUrlIdRef.current = null; // Keeps ref in sync with pushState    setSelectedId(null);
    syncParcelIdToUrl(null);
    polygonProps.onSelect?.(null);
  };

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      <div className="relative flex-1 h-full min-h-0 min-w-0">
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
        <MapView
          {...mapProps}
          mapRef={mapRef}
          onLoad={() => setMapLoaded(true)}
        >
          <PropertyPolygons
            {...polygonProps}
            colorByYearBuilt={colorByYearBuilt}
            selectedId={selectedId}
            onSelect={handlePolygonSelect}
          />
          {properties && <PropertyMarkers properties={properties} />}
        </MapView>

        {/* Floating Year Built choropleth toggle and color scale legend */}
        <div className="absolute z-20 bottom-8 left-4 pointer-events-auto">
          <YearBuiltLegend
            active={colorByYearBuilt}
            onToggle={setColorByYearBuilt}
          />
        </div>
      </div>
      {/* Property Sidebar showcases a list of self hidding info divs */}
      <PropertySidebar
        selectedId={selectedId}
        property={property}
        loading={propertyLoading}
        onClose={handleClearSelection}
      />
    </div>
  );
}
