import type { ReactNode } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as ApolloReact from "@apollo/client/react";
import { MockedProvider } from "@apollo/client/testing/react";

vi.mock("@apollo/client/react", async (importOriginal) => {
  const actual = await importOriginal<typeof ApolloReact>();
  return {
    ...actual,
    useLazyQuery: vi.fn(actual.useLazyQuery),
  };
});

import { useGqlAddressSearch } from "@/components/map/use-gql-address-search";
import { GET_PROPERTY_BY_ADDRESS } from "@/lib/graphql/queries";

describe("useGqlAddressSearch", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(ApolloReact.useLazyQuery).mockReset();
  });

  describe("Debounce timer & input sanitization mechanics", () => {
    it("debounces rapid search calls by 300ms, cancels intermediate timers, and sanitizes to trimmed uppercase", () => {
      vi.useFakeTimers();
      const mockFetchAddress = vi.fn();
      vi.mocked(ApolloReact.useLazyQuery).mockReturnValue([
        mockFetchAddress,
        { data: undefined, loading: false, error: undefined },
      ] as unknown as ReturnType<typeof ApolloReact.useLazyQuery>);

      const { result } = renderHook(() => useGqlAddressSearch());

      act(() => {
        result.current.debouncedSearch("  123 ");
      });
      act(() => {
        vi.advanceTimersByTime(150);
        result.current.debouncedSearch("  123 main ");
      });
      act(() => {
        vi.advanceTimersByTime(150);
        result.current.debouncedSearch("  123 main st  ");
      });

      // 300ms has not elapsed since the last keystroke
      expect(mockFetchAddress).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockFetchAddress).toHaveBeenCalledOnce();
      expect(mockFetchAddress).toHaveBeenCalledWith({
        variables: { prefix: "123 MAIN ST" },
      });
    });

    it("does not trigger a GraphQL query when search input is empty or whitespace-only", () => {
      const mockFetchAddress = vi.fn();
      vi.mocked(ApolloReact.useLazyQuery).mockReturnValue([
        mockFetchAddress,
        { data: undefined, loading: false, error: undefined },
      ] as unknown as ReturnType<typeof ApolloReact.useLazyQuery>);

      const { result } = renderHook(() => useGqlAddressSearch());

      act(() => {
        result.current.searchAddress("    ");
      });

      expect(mockFetchAddress).not.toHaveBeenCalled();
    });

    it("cleans up pending debounce timer on unmount without firing fetchAddress", () => {
      vi.useFakeTimers();
      const mockFetchAddress = vi.fn();
      vi.mocked(ApolloReact.useLazyQuery).mockReturnValue([
        mockFetchAddress,
        { data: undefined, loading: false, error: undefined },
      ] as unknown as ReturnType<typeof ApolloReact.useLazyQuery>);

      const { result, unmount } = renderHook(() => useGqlAddressSearch());

      act(() => {
        result.current.debouncedSearch("500 5th Ave");
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockFetchAddress).not.toHaveBeenCalled();
    });
  });

  describe("GraphQL contract & malformed record filtering with MockedProvider", () => {
    it("executes GET_PROPERTY_BY_ADDRESS and filters out items with missing parcel_id, address_line1, or invalid/zero coordinates", async () => {
      const mocks = [
        {
          request: {
            query: GET_PROPERTY_BY_ADDRESS,
            variables: { prefix: "BROADWAY" },
          },
          result: {
            data: {
              reonomyProperties: {
                items: [
                  {
                    parcel_id: "VALID_1",
                    address_line1: "100 BROADWAY",
                    lat: 40.7081,
                    lon: -74.0113,
                  },
                  {
                    parcel_id: null,
                    address_line1: "MISSING PARCEL ID",
                    lat: 40.71,
                    lon: -74.01,
                  },
                  {
                    parcel_id: "MISSING_ADDR",
                    address_line1: null,
                    lat: 40.71,
                    lon: -74.01,
                  },
                  {
                    parcel_id: "ZERO_COORDS",
                    address_line1: "0 BROADWAY",
                    lat: 0,
                    lon: 0,
                  },
                  {
                    parcel_id: "NULL_COORDS",
                    address_line1: "NULL COORDS ST",
                    lat: null,
                    lon: null,
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

      const { result } = renderHook(() => useGqlAddressSearch(), { wrapper });

      act(() => {
        result.current.searchAddress("  broadway ");
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.addresses).toHaveLength(1);
      });

      expect(result.current.addresses).toEqual([
        {
          parcel_id: "VALID_1",
          address_line1: "100 BROADWAY",
          lat: 40.7081,
          lon: -74.0113,
        },
      ]);
    });
  });
});
