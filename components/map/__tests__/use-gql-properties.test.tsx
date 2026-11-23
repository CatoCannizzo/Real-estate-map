import type { ReactNode } from "react";
import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { useGqlProperties } from "@/components/map/use-gql-properties";
import { GET_PARCEL_PROPERTIES } from "@/lib/graphql/queries";

describe("useGqlProperties", () => {
  it("fetches parcels, assembles formatted addresses from partial segments, and filters invalid coordinates", async () => {
    const mocks = [
      {
        request: {
          query: GET_PARCEL_PROPERTIES,
        },
        result: {
          data: {
            parcels: {
              items: [
                {
                  id: "PARCEL_FULL",
                  latitude: "40.7128",
                  longitude: "-74.0060",
                  address_street_number: "350",
                  address_street: "5th Ave",
                  address_unit: null,
                  address_citytown: "New York",
                  address_state: "NY",
                  address_zip: "10118",
                },
                {
                  id: "PARCEL_PARTIAL_ADDR",
                  latitude: "40.7580",
                  longitude: "-73.9855",
                  address_street_number: null,
                  address_street: "Broadway",
                  address_unit: null,
                  address_citytown: null,
                  address_state: "NY",
                  address_zip: null,
                },
                {
                  id: "PARCEL_NO_ADDR",
                  latitude: "40.7484",
                  longitude: "-73.9857",
                  address_street_number: null,
                  address_street: null,
                  address_unit: null,
                  address_citytown: null,
                  address_state: null,
                  address_zip: null,
                },
                {
                  id: "PARCEL_INVALID_LAT",
                  latitude: "not-a-number",
                  longitude: "-74.0060",
                  address_street_number: "1",
                  address_street: "Bad Coord Way",
                  address_unit: null,
                  address_citytown: "New York",
                  address_state: "NY",
                  address_zip: "10001",
                },
                {
                  id: "PARCEL_ZERO_COORDS",
                  latitude: "0",
                  longitude: "0",
                  address_street_number: "0",
                  address_street: "Null Island",
                  address_unit: null,
                  address_citytown: null,
                  address_state: null,
                  address_zip: null,
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

    const { result } = renderHook(() => useGqlProperties(), { wrapper });

    expect(result.current.properties).toEqual([]);

    act(() => {
      result.current.getProperties();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.properties).toHaveLength(3);
    });

    expect(result.current.properties).toEqual([
      {
        id: "PARCEL_FULL",
        latitude: 40.7128,
        longitude: -74.006,
        address: "350 5th Ave, New York, NY 10118",
      },
      {
        id: "PARCEL_PARTIAL_ADDR",
        latitude: 40.758,
        longitude: -73.9855,
        address: "Broadway, NY",
      },
      {
        id: "PARCEL_NO_ADDR",
        latitude: 40.7484,
        longitude: -73.9857,
        address: undefined,
      },
    ]);
  });
});
