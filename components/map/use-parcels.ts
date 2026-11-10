"use client";
import { useLazyQuery } from "@apollo/client/react";
import { useMemo } from "react";

import { GET_PARCELS } from "@/lib/graphql/parcels";
import type { Property } from "@/components/map/property-type";

export function useParcels() {
  const [getParcels, { data, loading, error }] = useLazyQuery(GET_PARCELS);

  //Map graphql data to the property interface
  const parcels = useMemo<Property[]>(() => {
    return (data?.parcels?.items ?? [])
      .map((parcel): Property | null => {
        const lat = parcel.latitude;
        const long = parcel.longitude;
        //Check if coords loaded correctly
        if (!lat || !long || isNaN(lat) || isNaN(long)) {
          return null;
        }

        const street = [parcel.address_street_number, parcel.address_street]
          .filter(Boolean)
          .join(" ");
        const stateZip = [parcel.address_state, parcel.address_zip]
          .filter(Boolean)
          .join(" ");
        const address = [street, parcel.address_citytown, stateZip]
          .filter(Boolean)
          .join(", ");

        return {
          id: parcel.id,
          latitude: lat,
          longitude: long,
          address: address || undefined,
        };
      })
      .filter((prop): prop is Property => prop !== null);
  }, [data]);

  return {
    parcels,
    getParcels,
    loading,
    error,
  };
}
