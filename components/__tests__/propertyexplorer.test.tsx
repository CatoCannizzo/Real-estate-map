import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const mockFlyTo = vi.fn();

// Tier A react-map-gl/mapbox boundary mock:
// - <Map> forwards mapRef with spyable flyTo()
// - useMap() returns { current: null } so PropertyPolygons safely skips imperative WebGL canvas hooks
vi.mock("react-map-gl/mapbox", () => ({
  default: React.forwardRef(function MockMap(
    { children, onLoad }: { children?: React.ReactNode; onLoad?: () => void },
    ref: React.Ref<{ flyTo: typeof mockFlyTo }>,
  ) {
    React.useImperativeHandle(ref, () => ({
      flyTo: mockFlyTo,
    }));
    React.useEffect(() => {
      onLoad?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid="mapbox-map">{children}</div>;
  }),
  Source: ({ children, id }: { children?: React.ReactNode; id: string }) => (
    <div data-testid={`mapbox-source-${id}`}>{children}</div>
  ),
  Layer: ({ id }: { id: string }) => <div data-testid={`mapbox-layer-${id}`} />,
  Marker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mapbox-marker">{children}</div>
  ),
  Popup: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mapbox-popup">{children}</div>
  ),
  useMap: () => ({ current: null }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

const mockUsePropertyDetails = vi.fn();
const mockUseGqlAddressSearch = vi.fn();

vi.mock("@/components/map/use-property-details", () => ({
  usePropertyDetails: (...args: unknown[]) => mockUsePropertyDetails(...args),
}));

vi.mock("@/components/map/use-gql-address-search", () => ({
  useGqlAddressSearch: () => mockUseGqlAddressSearch(),
}));

import PropertyExplorer from "@/components/propertyexplorer";

const DEFAULT_MAP_PROPS = {
  initialView: {
    latitude: 40.7128,
    longitude: -74.006,
    zoom: 13,
  },
};

const DEFAULT_POLYGON_PROPS = {
  sourceType: "vector" as const,
  sourceId: "nyc-parcels",
  sourceUrl: "mapbox://example.nyc-parcels",
  sourceLayer: "parcels",
};

describe("PropertyExplorer Coordinator Integration", () => {
  const mockSearchAddress = vi.fn();
  const mockDebouncedSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGqlAddressSearch.mockReturnValue({
      addresses: [
        {
          parcel_id: "PARCEL_500",
          address_line1: "500 5th Ave",
          lat: 40.7532,
          lon: -73.9808,
        },
      ],
      searchAddress: mockSearchAddress,
      debouncedSearch: mockDebouncedSearch,
      loading: false,
      error: undefined,
    });

    mockUsePropertyDetails.mockImplementation((selectedId: string | null) => ({
      property:
        selectedId === "PARCEL_500"
          ? {
              id: "PARCEL_500",
              address: "500 5th Ave",
              city: "New York",
              state: "NY",
              zip: "10110",
              latitude: 40.7532,
              longitude: -73.9808,
              yearBuilt: 1931,
              buildingSqFt: 650000,
            }
          : null,
      loading: false,
      error: undefined,
    }));
  });

  it("coordinates address search, dropdown selection, mapRef.flyTo camera flight, and PropertySidebar details", async () => {
    const user = userEvent.setup();
    const handlePolygonSelect = vi.fn();

    render(
      <PropertyExplorer
        mapProps={DEFAULT_MAP_PROPS}
        polygonProps={{
          ...DEFAULT_POLYGON_PROPS,
          onSelect: handlePolygonSelect,
        }}
      />,
    );

    // Initially no property is selected in the sidebar
    expect(screen.getByText("No Property Selected")).toBeInTheDocument();

    // Type in the search bar
    const searchInput = screen.getByRole("combobox");
    await user.type(searchInput, "500");
    expect(mockDebouncedSearch).toHaveBeenCalledWith("500");

    // Select the suggested address from the dropdown
    await user.click(screen.getByText("500 5th Ave"));

    // 1. Search input updates to selected address
    expect(searchInput).toHaveValue("500 5th Ave");
    // 2. polygonProps.onSelect is notified with the parcel ID
    expect(handlePolygonSelect).toHaveBeenCalledWith("PARCEL_500");
    // 3. Map camera animates to [lon, lat] at zoom 17
    expect(mockFlyTo).toHaveBeenCalledWith({
      center: [-73.9808, 40.7532],
      zoom: 17,
      duration: 2000,
    });
    // 4. PropertySidebar renders the selected parcel's details
    expect(screen.getByText("ID: PARCEL_500")).toBeInTheDocument();
    expect(screen.getByText("650,000 sq ft")).toBeInTheDocument();

    // 5. Clicking the sidebar close button resets selectedId to null
    await user.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(screen.getByText("No Property Selected")).toBeInTheDocument();
  });

  it("toggles YearBuiltLegend choropleth state from Off to Active", async () => {
    const user = userEvent.setup();
    render(
      <PropertyExplorer
        mapProps={DEFAULT_MAP_PROPS}
        polygonProps={DEFAULT_POLYGON_PROPS}
      />,
    );

    const toggleBtn = screen.getByRole("button", { name: "Off" });
    expect(screen.queryByText("≤ 1900")).not.toBeInTheDocument();

    await user.click(toggleBtn);
    expect(screen.getByRole("button", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByText("≤ 1900")).toBeInTheDocument();
  });

  it("displays sonner error toasts when searchError or propertyError occurs", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockUseGqlAddressSearch.mockReturnValue({
      addresses: [],
      searchAddress: mockSearchAddress,
      debouncedSearch: mockDebouncedSearch,
      loading: false,
      error: new Error("Search service offline"),
    });

    mockUsePropertyDetails.mockReturnValue({
      property: null,
      loading: false,
      error: new Error("Property details query failed"),
    });

    render(
      <PropertyExplorer
        mapProps={DEFAULT_MAP_PROPS}
        polygonProps={DEFAULT_POLYGON_PROPS}
      />,
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Address search unavailable",
      expect.objectContaining({
        description: expect.stringMatching(/trouble reaching the search service/i),
      }),
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Property details unavailable",
      expect.objectContaining({
        description: expect.stringMatching(/Could not load details for this parcel/i),
      }),
    );

    consoleErrorSpy.mockRestore();
  });
});
