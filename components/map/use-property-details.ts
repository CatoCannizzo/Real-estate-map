"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import type { Property } from "@/components/map/property-type";
import type { PropertyPolygonsProps } from "@/components/map/property-polygons";
import {
  GET_REONOMY_PROPERTY,
  type ReonomyPropertyItem,
} from "@/lib/graphql/queries";

export interface UsePropertyDetailsResult {
  property: Property | null;
  loading: boolean;
  error?: Error;
}

/**
 * Maps a raw graphql property return into the canonical `Property` interface.
 */
function mapReonomyPropertyToProperty(
  rpi: ReonomyPropertyItem,
): Property | null {
  const id = rpi.parcel_id ?? "";
  const address = rpi.address_line1;
  const city = rpi.city;
  const lat = rpi.lat;
  const long = rpi.lon;
  const yearBuilt = rpi.year_built;
  const reonomyPropertySales = (rpi.reonomyPropertySale?.items ?? []).map(
    (sale) => ({
      salesId: sale.sales_id,
      recordingDate: sale.recording_date ?? null,
      saleAmount: sale.sale_amount ?? null,
      pricePerBuildingArea: sale.price_per_building_area ?? null,
      documentType: sale.document_type ?? null,
    }),
  );
  //Check if coords loaded correctly
  if (!lat || !long || isNaN(lat) || isNaN(long)) {
    return null;
  }

  return {
    id: id,
    address: address ?? undefined,
    city: city ?? undefined,
    state: "NY",
    zip: rpi.zip5 ?? undefined,
    neighborhood: rpi.neighborhood_name ?? undefined,
    propertyType: rpi.asset_type ?? undefined,
    buildingSqFt: rpi.building_area ? Number(rpi.building_area) : null,
    landSqFt: rpi.lot_size_sqft ?? null,
    totalUnits: rpi.total_units ?? null,
    stories: rpi.floors ?? null,
    latitude: lat,
    longitude: long,
    yearBuilt: yearBuilt ?? null,
    salesHistory: reonomyPropertySales,
  };
}

/**
 * Maps a raw GeoJSON feature `properties` dictionary (e.g., Seattle / King County parcel data)
 * into the canonical `Property` interface.
 */
function mapGeoJsonFeatureToProperty(
  raw: Record<string, unknown>,
  fallbackId: string,
  idProperty: string,
): Property {
  const id = String(raw[idProperty] ?? raw.pin ?? fallbackId);
  const latitude = typeof raw.centroid_lat === "number" ? raw.centroid_lat : 0;
  const longitude = typeof raw.centroid_lng === "number" ? raw.centroid_lng : 0;

  const rawAddress =
    typeof raw.address === "string"
      ? raw.address.trim().replace(/\s+/g, " ")
      : undefined;

  const yearBuilt =
    typeof raw.year_built_n === "number" && raw.year_built_n > 0
      ? raw.year_built_n
      : null;

  const landAv = typeof raw.land_av === "number" ? raw.land_av : null;
  const bldgAv = typeof raw.bldg_av === "number" ? raw.bldg_av : null;
  const totalAv =
    landAv !== null || bldgAv !== null ? (landAv ?? 0) + (bldgAv ?? 0) : null;

  return {
    id,
    latitude,
    longitude,
    address: rawAddress || undefined,
    city: "Seattle",
    state: "WA",
    neighborhood: typeof raw.uv_name === "string" ? raw.uv_name : undefined,
    propertyName: typeof raw.prop_name === "string" ? raw.prop_name : undefined,
    propertyType:
      typeof raw.land_use_desc === "string" ? raw.land_use_desc : undefined,
    yearBuilt,
    buildingSqFt:
      typeof raw.bldg_grss_sqft === "number" ? raw.bldg_grss_sqft : null,
    landSqFt: typeof raw.land_sqft === "number" ? raw.land_sqft : null,
    totalUnits: typeof raw.exist_units === "number" ? raw.exist_units : null,
    assessedLandValue: landAv,
    assessedBuildingValue: bldgAv,
    assessedTotalValue: totalAv,
    developmentStatus:
      typeof raw.status_text_1 === "string" ? raw.status_text_1 : undefined,
    assessorUrl: typeof raw.pin_link === "string" ? raw.pin_link : undefined,
  };
}

/**
 * Resolves full `Property` details for the currently selected parcel ID
 * based on the active polygon source type ("geojson" vs "vector").
 */
export function usePropertyDetails(
  selectedId: string | null,
  polygonProps: PropertyPolygonsProps,
): UsePropertyDetailsResult {
  const isVectorSource: boolean =
    polygonProps.sourceType === "vector" && Boolean(selectedId);
  const {
    data: reonomyData,
    loading: reonomyLoading,
    error: reonomyError,
  } = useQuery(GET_REONOMY_PROPERTY, {
    skip: !isVectorSource,
    variables: { parcel_id: selectedId ?? "" },
  });

  const property = useMemo<Property | null>(() => {
    if (!selectedId) return null;

    if (polygonProps.sourceType === "geojson") {
      if (typeof polygonProps.data === "string") {
        return null;
      }

      const idKey = polygonProps.idProperty ?? "id";
      const match = polygonProps.data.features.find(
        (feature) => String(feature.properties?.[idKey]) === selectedId,
      );

      if (!match || !match.properties) return null;

      return mapGeoJsonFeatureToProperty(
        match.properties as Record<string, unknown>,
        selectedId,
        idKey,
      );
    }

    if (polygonProps.sourceType === "vector") {
      const reonomyProperty = reonomyData?.reonomyProperties?.items?.[0];
      if (!reonomyProperty) return null;

      return mapReonomyPropertyToProperty(reonomyProperty);
    }

    return null;
  }, [selectedId, polygonProps, reonomyData]);

  return {
    property,
    loading: reonomyLoading ? reonomyLoading && isVectorSource : false,
    error: isVectorSource ? reonomyError : undefined,
  };
}
