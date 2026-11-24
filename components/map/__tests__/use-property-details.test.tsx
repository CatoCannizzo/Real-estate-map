import type { ReactNode } from "react";
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import type { FeatureCollection } from "geojson";
import { usePropertyDetails } from "@/components/map/use-property-details";
import { GET_REONOMY_PROPERTY } from "@/lib/graphql/queries";

const vectorPolygonProps = {
  sourceType: "vector" as const,
  sourceId: "parcels-source",
  sourceUrl: "mapbox://example.parcels",
  sourceLayer: "parcels",
};

const sampleGeoJsonData: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-122.3321, 47.6062] },
      properties: {
        pin: "WA_PIN_100",
        centroid_lat: 47.6062,
        centroid_lng: -122.3321,
        address: "  400   Broad   St  ",
        uv_name: "Seattle Center",
        prop_name: "Space Needle Parcel",
        land_use_desc: "Commercial / Landmark",
        year_built_n: 1962,
        bldg_grss_sqft: 85000,
        land_sqft: 144000,
        exist_units: 1,
        land_av: 25000000,
        bldg_av: 75000000,
        status_text_1: "Existing",
        pin_link: "https://blue.kingcounty.com/Assessor/eRealProperty/Detail.aspx?ParcelNbr=WA_PIN_100",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-122.33, 47.6] },
      properties: {
        pin: "WA_PIN_ZERO_YEAR",
        centroid_lat: 47.6,
        centroid_lng: -122.33,
        address: "   ",
        year_built_n: 0,
        land_av: 500000,
        bldg_av: null,
      },
    },
  ],
};

describe("usePropertyDetails", () => {
  describe("GeoJSON source branch (King County / Seattle)", () => {
    const geoJsonPolygonProps = {
      sourceType: "geojson" as const,
      sourceId: "seattle-parcels",
      idProperty: "pin",
      data: sampleGeoJsonData,
    };

    const emptyWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={[]}>{children}</MockedProvider>
    );

    it("resolves and normalizes a matching GeoJSON feature synchronously without querying GraphQL", () => {
      const { result } = renderHook(
        () => usePropertyDetails("WA_PIN_100", geoJsonPolygonProps),
        { wrapper: emptyWrapper },
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.property).toEqual({
        id: "WA_PIN_100",
        latitude: 47.6062,
        longitude: -122.3321,
        address: "400 Broad St",
        city: "Seattle",
        state: "WA",
        neighborhood: "Seattle Center",
        propertyName: "Space Needle Parcel",
        propertyType: "Commercial / Landmark",
        yearBuilt: 1962,
        buildingSqFt: 85000,
        landSqFt: 144000,
        totalUnits: 1,
        assessedLandValue: 25000000,
        assessedBuildingValue: 75000000,
        assessedTotalValue: 100000000,
        developmentStatus: "Existing",
        assessorUrl:
          "https://blue.kingcounty.com/Assessor/eRealProperty/Detail.aspx?ParcelNbr=WA_PIN_100",
      });
    });

    it("normalizes year_built_n <= 0 to null, blank whitespace address to undefined, and handles partial assessed values", () => {
      const { result } = renderHook(
        () => usePropertyDetails("WA_PIN_ZERO_YEAR", geoJsonPolygonProps),
        { wrapper: emptyWrapper },
      );

      expect(result.current.property).not.toBeNull();
      expect(result.current.property?.yearBuilt).toBeNull();
      expect(result.current.property?.address).toBeUndefined();
      expect(result.current.property?.assessedLandValue).toBe(500000);
      expect(result.current.property?.assessedBuildingValue).toBeNull();
      expect(result.current.property?.assessedTotalValue).toBe(500000);
    });

    it("returns null when selectedId is null, feature is not found, or GeoJSON data is a remote URL string", () => {
      const { result: nullSelection } = renderHook(
        () => usePropertyDetails(null, geoJsonPolygonProps),
        { wrapper: emptyWrapper },
      );
      expect(nullSelection.current.property).toBeNull();

      const { result: missingFeature } = renderHook(
        () => usePropertyDetails("UNKNOWN_PIN", geoJsonPolygonProps),
        { wrapper: emptyWrapper },
      );
      expect(missingFeature.current.property).toBeNull();

      const { result: stringDataResult } = renderHook(
        () =>
          usePropertyDetails("WA_PIN_100", {
            sourceType: "geojson",
            sourceId: "remote-geojson",
            data: "https://example.com/parcels.geojson",
          }),
        { wrapper: emptyWrapper },
      );
      expect(stringDataResult.current.property).toBeNull();
    });
  });

  describe("Vector source branch (GraphQL Reonomy)", () => {
    it("maps salesHistory items and coerces string coordinates and building area", async () => {
      const parcelId = "NY_PARCEL_77";
      const mocks = [
        {
          request: {
            query: GET_REONOMY_PROPERTY,
            variables: { parcel_id: parcelId },
          },
          result: {
            data: {
              reonomyProperties: {
                items: [
                  {
                    parcel_id: parcelId,
                    address_line1: "77 Water St",
                    city: "New York",
                    zip5: "10005",
                    neighborhood_name: "Financial District",
                    asset_type: "Office",
                    building_area: 600000,
                    lot_size_sqft: 32000,
                    total_units: 25,
                    floors: 26,
                    lat: 40.7042,
                    lon: -74.0067,
                    year_built: 1970,
                    reonomyPropertySale: {
                      items: [
                        {
                          sales_id: "SALE_1",
                          recording_date: "2022-06-15",
                          sale_amount: 250000000,
                          price_per_building_area: 416.67,
                          document_type: "Deed",
                        },
                      ],
                    },
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
        () => usePropertyDetails(parcelId, vectorPolygonProps),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.property?.salesHistory).toEqual([
        {
          salesId: "SALE_1",
          recordingDate: "2022-06-15",
          saleAmount: 250000000,
          pricePerBuildingArea: 416.67,
          documentType: "Deed",
        },
      ]);
    });

    it("returns null property if the returned GraphQL record has missing or zero coordinates", async () => {
      const badCoordParcelId = "PARCEL_BAD_COORDS";
      const mocks = [
        {
          request: {
            query: GET_REONOMY_PROPERTY,
            variables: { parcel_id: badCoordParcelId },
          },
          result: {
            data: {
              reonomyProperties: {
                items: [
                  {
                    parcel_id: badCoordParcelId,
                    address_line1: "0 Null Island",
                    city: "New York",
                    zip5: "10001",
                    neighborhood_name: null,
                    asset_type: null,
                    building_area: null,
                    lot_size_sqft: null,
                    total_units: null,
                    floors: null,
                    lat: 0,
                    lon: 0,
                    year_built: null,
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
        () => usePropertyDetails(badCoordParcelId, vectorPolygonProps),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.property).toBeNull();
    });
  });
});
