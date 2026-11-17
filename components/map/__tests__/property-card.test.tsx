import type { ReactNode } from "react";
import { describe, it, expect } from "vitest";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { House } from "lucide-react";
import {
  formatBoolean,
  PropertyDetailCard,
  PropertySidebar,
} from "@/components/map/property-sidebar";
import { usePropertyDetails } from "@/components/map/use-property-details";
import { GET_REONOMY_PROPERTY } from "@/lib/graphql/queries";

describe("Property card - Formatters & Fallbacks", () => {
  // Pure Function Unit Test
  describe("formatBoolean", () => {
    it("Returns 'Yes' for True and 'No' for False", () => {
      expect(formatBoolean(true)).toBe("Yes");
      expect(formatBoolean(false)).toBe("No");
    });

    it("Returns '—' when value is null or undefined", () => {
      expect(formatBoolean(null)).toBe("—");
      expect(formatBoolean(undefined)).toBe("—");
    });
  });

  // Component Render Test
  describe("PropertyDetailCard", () => {
    it("Renders '—' for a missing field when the card has other data", () => {
      render(
        <PropertyDetailCard
          title="Building Specs"
          icon={House}
          items={[
            { label: "Address", value: "123 Main St" },
            { label: "Floors", value: null },
          ]}
        />,
      );

      expect(screen.getByText("Address")).toBeInTheDocument();
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
      expect(screen.getByText("Floors")).toBeInTheDocument();
      expect(screen.getByText("—")).toBeInTheDocument();
    });
    it("renders no DOM elements when ALL items have missing values ", () => {
      const { container } = render(
        <PropertyDetailCard
          title="Empty Specs"
          icon={House}
          items={[
            { label: "Address", value: null },
            { label: "Floors", value: null },
          ]}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  // Empty parcel record fallback
  describe("PropertySidebar empty record fallback", () => {
    it("renders 'No data for this parcel' when a selected parcel has no record", () => {
      render(
        <PropertySidebar
          selectedId="PARCEL_999"
          property={null}
          loading={false}
        />,
      );

      expect(screen.getByText("Selected Parcel ID")).toBeInTheDocument();
      expect(screen.getByText("PARCEL_999")).toBeInTheDocument();
      expect(screen.getByText("No data for this parcel")).toBeInTheDocument();
    });
  });

  // Apollo MockedProvider query hook tests
  describe("usePropertyDetails with MockedProvider", () => {
    const vectorPolygonProps = {
      sourceType: "vector" as const,
      sourceId: "parcels-source",
      sourceUrl: "mapbox://example.parcels",
      sourceLayer: "parcels",
    };

    it("fetches and maps parcel details for a matching parcel_id", async () => {
      const mockParcelId = "1000010001";
      const mocks = [
        {
          request: {
            query: GET_REONOMY_PROPERTY,
            variables: { parcel_id: mockParcelId },
          },
          result: {
            data: {
              reonomyProperties: {
                items: [
                  {
                    parcel_id: mockParcelId,
                    address_line1: "123 Broadway",
                    city: "New York",
                    zip5: "10001",
                    neighborhood_name: "Midtown",
                    asset_type: "Office",
                    building_area: 50000,
                    lot_size_sqft: 10000,
                    total_units: 12,
                    floors: 8,
                    lat: 40.7128,
                    lon: -74.006,
                    year_built: 1985,
                    reonomyPropertySale: { items: [] },
                  },
                ],
              },
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks}>{children}</MockedProvider>
      );

      const { result } = renderHook(
        () => usePropertyDetails(mockParcelId, vectorPolygonProps),
        { wrapper },
      );

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.property).not.toBeNull();
      expect(result.current.property?.id).toBe(mockParcelId);
      expect(result.current.property?.address).toBe("123 Broadway");
      expect(result.current.property?.buildingSqFt).toBe(50000);
      expect(result.current.property?.yearBuilt).toBe(1985);
    });

    it("returns null property when the GraphQL query returns no items", async () => {
      const missingParcelId = "PARCEL_EMPTY";
      const mocks = [
        {
          request: {
            query: GET_REONOMY_PROPERTY,
            variables: { parcel_id: missingParcelId },
          },
          result: {
            data: {
              reonomyProperties: {
                items: [],
              },
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks}>{children}</MockedProvider>
      );

      const { result } = renderHook(
        () => usePropertyDetails(missingParcelId, vectorPolygonProps),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.property).toBeNull();
    });
  });
});
