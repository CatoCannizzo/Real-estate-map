"use client";
import { useLazyQuery } from "@apollo/client/react";
import { useMemo } from "react";

import { GET_PROPERTIES } from "@/lib/graphql/parcels";
import type { Property } from "@/components/map/property-type";

export function useGqlProperties() {
  const [getProperties, { data, loading, error }] =
    useLazyQuery(GET_PROPERTIES);

  //Map graphql data to the property interface
  const properties = useMemo<Property[]>(() => {
    return (data?.parcels?.items ?? [])
      .map((item): Property | null => {
        const lat = item.latitude;
        const long = item.longitude;
        //Check if coords loaded correctly
        if (!lat || !long || isNaN(lat) || isNaN(long)) {
          return null;
        }

        const street = [
          item.address_street_number,
          item.address_street,
        ]
          .filter(Boolean)
          .join(" ");
        const stateZip = [item.address_state, item.address_zip]
          .filter(Boolean)
          .join(" ");
        const address = [street, item.address_citytown, stateZip]
          .filter(Boolean)
          .join(", ");

        return {
          id: item.id,
          latitude: lat,
          longitude: long,
          address: address || undefined,
        };
      })
      .filter((property): property is Property => property !== null);
  }, [data]);

  return {
    properties,
    getProperties,
    loading,
    error,
  };
}
