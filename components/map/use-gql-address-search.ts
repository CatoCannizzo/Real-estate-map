"use client";
import { useLazyQuery } from "@apollo/client/react";
import { useEffect, useRef, useMemo } from "react";

import { GET_PROPERTY_BY_ADDRESS } from "@/lib/graphql/parcels";
import type { AddressSearchItem } from "@/lib/graphql/parcels";

export function useGqlAddressSearch() {
  // Initializes the lazy GraphQl query and sets state for the search results, loading state, and error state
  const [fetchAddress, { data, loading, error }] = useLazyQuery(
    GET_PROPERTY_BY_ADDRESS,
  );

  // Cleans the input and calls the GraphQl query to fetch addresses
  const searchAddress = (prefix: string) => {
    const sanitized = prefix.trim().toUpperCase();
    if (!sanitized) return;
    fetchAddress({ variables: { prefix: sanitized } });
  };

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSearch = (prefix: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      searchAddress(prefix);
    }, 300);
  };
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  //Memoizes the addresses and maps to the AddressSearchItem interface
  const addresses = useMemo<AddressSearchItem[]>(() => {
    return (data?.reonomyProperties?.items ?? [])
      .map((item): AddressSearchItem | null => {
        if (
          !item.lat ||
          !item.lon ||
          !item.parcel_id ||
          !item.address_line1 ||
          isNaN(item.lat) ||
          isNaN(item.lon)
        ) {
          return null;
        }
        return {
          parcel_id: item.parcel_id,
          address_line1: item.address_line1,
          lat: item.lat,
          lon: item.lon,
        };
      })
      .filter((items): items is AddressSearchItem => !!items);
  }, [data]);

  return { addresses, searchAddress, debouncedSearch, loading, error };
}
