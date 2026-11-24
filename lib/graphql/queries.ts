import { graphql } from "./generated";
import type { GetReonomyPropertyQuery } from "./generated/graphql";
// Types for looking up full Reonomy property records by parcel ID

// Full property details returned for a parcel from the Reonomy dataset
export type ReonomyPropertyItem =
  GetReonomyPropertyQuery["reonomyProperties"]["items"][number];

// Lightweight address result used to show suggestions in the search bar dropdown
export interface AddressSearchItem {
  parcel_id: string;
  address_line1: string;
  lat: number;
  lon: number;
}

// Grabs year_built by ID in chunks of 50
export const GET_YEAR_BUILT_BY_IDS = graphql(`
  query ParcelsByIds($ids: [String!]) {
    reonomyProperties(first: 50, filter: { parcel_id: { in: $ids } }) {
      items {
        parcel_id
        year_built
      }
    }
  }
`);

// Pulls detailed building specs, lot size, and up to 20 past sales for a single parcel ID
export const GET_REONOMY_PROPERTY = graphql(`
  query GetReonomyProperty($parcel_id: String!) {
    reonomyProperties(first: 1, filter: { parcel_id: { eq: $parcel_id } }) {
      items {
        parcel_id
        address_line1
        city
        zip5
        neighborhood_name
        asset_type
        building_area
        lot_size_sqft
        total_units
        floors
        lat
        lon
        year_built
        reonomyPropertySale(first: 20) {
          items {
            sales_id
            recording_date
            sale_amount
            price_per_building_area
            document_type
          }
        }
      }
    }
  }
`);

// Pulls basic parcel coordinates and addresses (used for bulk map marker loading)
export const GET_PARCEL_PROPERTIES = graphql(`
  query GetParcelProperties {
    parcels {
      items {
        id
        latitude
        longitude
        address_zip
        address_state
        address_citytown
        address_street
        address_street_number
        address_unit
      }
    }
  }
`);

// Searches addresses in NYC starting with a prefix string (capped at 8 results for autocomplete)
export const GET_PROPERTY_BY_ADDRESS = graphql(`
  query searchAddress($prefix: String!) {
    reonomyProperties(
      first: 8
      filter: {
        address_line1: { startsWith: $prefix }
        city: { eq: "NEW YORK" }
      }
    ) {
      items {
        parcel_id
        address_line1
        lat
        lon
      }
    }
  }
`);
