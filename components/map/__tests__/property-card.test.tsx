import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import { House } from "lucide-react";
import {
  formatBoolean,
  formatCurrency,
  formatNumber,
  formatPricePerSqFt,
  PropertyDetailCard,
  PropertySidebar,
} from "@/components/map/property-sidebar";
import { usePropertyDetails } from "@/components/map/use-property-details";
import { GET_REONOMY_PROPERTY } from "@/lib/graphql/queries";
import type { Property } from "@/components/map/property-type";

describe("Property card - Formatters & Fallbacks", () => {
  // Pure Function Unit Tests
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

  describe("formatCurrency", () => {
    it("formats numbers to rounded USD currency", () => {
      expect(formatCurrency(1250000)).toBe("$1,250,000");
      expect(formatCurrency(0)).toBe("$0");
      expect(formatCurrency(99.9)).toBe("$100");
    });

    it("returns '—' for null, undefined, or NaN", () => {
      expect(formatCurrency(null)).toBe("—");
      expect(formatCurrency(undefined)).toBe("—");
      expect(formatCurrency(Number.NaN)).toBe("—");
    });
  });

  describe("formatNumber", () => {
    it("formats numbers with commas and optional suffix", () => {
      expect(formatNumber(50000, " sq ft")).toBe("50,000 sq ft");
      expect(formatNumber(12)).toBe("12");
      expect(formatNumber(0, " units")).toBe("0 units");
    });

    it("returns '—' for null, undefined, or NaN", () => {
      expect(formatNumber(null, " sq ft")).toBe("—");
      expect(formatNumber(undefined)).toBe("—");
      expect(formatNumber(Number.NaN)).toBe("—");
    });
  });

  describe("formatPricePerSqFt", () => {
    it("formats dollar amounts with /sf suffix", () => {
      expect(formatPricePerSqFt(450)).toBe("$450/sf");
      expect(formatPricePerSqFt(1200.4)).toBe("$1,200/sf");
      expect(formatPricePerSqFt(0)).toBe("$0/sf");
    });

    it("returns '—' for null, undefined, or NaN", () => {
      expect(formatPricePerSqFt(null)).toBe("—");
      expect(formatPricePerSqFt(undefined)).toBe("—");
      expect(formatPricePerSqFt(Number.NaN)).toBe("—");
    });
  });

  // Component Render Tests
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
            { label: "Blank", value: "" },
            { label: "Invalid Number", value: Number.NaN },
          ]}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("renders the card when all items are null but a footer is present", () => {
      render(
        <PropertyDetailCard
          title="Assessor Valuation"
          icon={House}
          items={[{ label: "Total Assessed Value", value: null }]}
          footer={<a href="https://example.com/assessor">County Assessor Record</a>}
        />,
      );

      expect(screen.getByText("Assessor Valuation")).toBeInTheDocument();
      expect(screen.getByText("—")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /county assessor record/i }),
      ).toHaveAttribute("href", "https://example.com/assessor");
    });
  });

  // PropertySidebar 4-state view machine
  describe("PropertySidebar state machine", () => {
    it("renders 'No Property Selected' prompt when selectedId is null", () => {
      render(<PropertySidebar selectedId={null} property={null} loading={false} />);

      expect(screen.getByText("No Property Selected")).toBeInTheDocument();
      expect(
        screen.getByText(/Click any parcel boundary on the map/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /clear selection/i }),
      ).not.toBeInTheDocument();
    });

    it("renders loading skeletons and selected parcel ID badge when loading is true", () => {
      const { container } = render(
        <PropertySidebar
          selectedId="PARCEL_LOADING_42"
          property={null}
          loading={true}
        />,
      );

      expect(screen.getByText("PARCEL_LOADING_42")).toBeInTheDocument();
      expect(
        container.querySelectorAll("[data-slot='skeleton']").length,
      ).toBeGreaterThanOrEqual(4);
      expect(
        screen.queryByText("No data for this parcel"),
      ).not.toBeInTheDocument();
    });

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

    it("renders populated property cards, sorts sales history chronologically, and triggers onClose", async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const mockProperty: Property = {
        id: "1001",
        latitude: 40.7128,
        longitude: -74.006,
        propertyName: "Empire Tower",
        address: "350 5th Ave",
        neighborhood: "Midtown",
        city: "New York",
        state: "NY",
        zip: "10118",
        propertyType: "Commercial Office",
        yearBuilt: 1931,
        buildingSqFt: 2248355,
        landSqFt: 91351,
        totalUnits: 102,
        stories: 102,
        assessedTotalValue: 950000000,
        assessorUrl: "https://assessor.example.gov/1001",
        salesHistory: [
          {
            salesId: "SALE_OLD",
            recordingDate: "2015-03-10",
            saleAmount: 400000000,
            pricePerBuildingArea: 178,
            documentType: "Deed",
          },
          {
            salesId: "SALE_NODATE",
            recordingDate: null,
            saleAmount: 100000000,
            pricePerBuildingArea: null,
            documentType: null,
          },
          {
            salesId: "SALE_NEW",
            recordingDate: "2023-11-20",
            saleAmount: 650000000,
            pricePerBuildingArea: 289,
            documentType: "Warranty Deed",
          },
        ],
      };

      render(
        <PropertySidebar
          selectedId="1001"
          property={mockProperty}
          loading={false}
          onClose={handleClose}
        />,
      );

      // Header summary and location subtitle
      expect(screen.getByText("Empire Tower")).toBeInTheDocument();
      expect(screen.getByText("350 5th Ave")).toBeInTheDocument();
      expect(
        screen.getByText("Midtown, New York, NY 10118"),
      ).toBeInTheDocument();
      expect(screen.getByText("ID: 1001")).toBeInTheDocument();

      // Formatted detail cards
      expect(screen.getByText("2,248,355 sq ft")).toBeInTheDocument();
      expect(screen.getByText("$950,000,000")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /county assessor record/i }),
      ).toHaveAttribute("href", "https://assessor.example.gov/1001");

      // Sales history chronological sorting (2023 newest -> 2015 -> null date last)
      expect(screen.getByText("Sales History (3)")).toBeInTheDocument();
      const amounts = screen.getAllByText(/^\$(650|400|100),000,000$/);
      expect(amounts.map((el) => el.textContent)).toEqual([
        "$650,000,000",
        "$400,000,000",
        "$100,000,000",
      ]);

      // Close button clears selection
      await user.click(screen.getByRole("button", { name: /clear selection/i }));
      expect(handleClose).toHaveBeenCalledOnce();
    });

    it("falls back to 'Unnamed Parcel' when neither propertyName nor address is provided", () => {
      render(
        <PropertySidebar
          selectedId="1002"
          property={{
            id: "1002",
            latitude: 47.6062,
            longitude: -122.3321,
          }}
          loading={false}
        />,
      );

      expect(screen.getByText("Unnamed Parcel")).toBeInTheDocument();
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
