import { gql, OperationVariables, TypedDocumentNode } from "@apollo/client";

// Types for looking up full Reonomy property records by parcel ID
interface ReonomyQuery {
  parcel_id: string;
}
export interface MassReonomyQuery {
  ids: string[];
}
interface ReonomyQueryResponse {
  reonomyProperties: { items: ReonomyPropertyItem[] };
}
// Represents the return for cloropleth map
export interface YearBuiltReturn {
  reonomyProperties: { items: YearBuiltItem[] };
}
export interface YearBuiltItem {
  parcel_id?: string;
  year_built?: number;
}

// Represents an individual past sale recorded on a property
export interface SaleRecord {
  sales_id: string;
  recording_date?: string;
  sale_amount?: number;
  price_per_building_area?: number;
  document_type?: string;
}

// Full property details returned for a parcel from the Reonomy dataset
export interface ReonomyPropertyItem {
  parcel_id?: string;
  address_line1?: string;
  city?: string;
  zip5?: string;
  neighborhood_name?: string;
  asset_type?: string;
  building_area?: number;
  lot_size_sqft?: number;
  total_units?: number;
  floors?: number;
  lat?: number;
  lon?: number;
  year_built?: number;
  reonomyPropertySale?: { items: SaleRecord[] };
}

// Types for the address search autocomplete bar
interface AddressSearchQuery {
  prefix: string;
}

// Lightweight address result used to show suggestions in the search bar dropdown
export interface AddressSearchItem {
  parcel_id: string;
  address_line1: string;
  lat: number;
  lon: number;
}
interface AddressSearchResponse {
  reonomyProperties: { items: AddressSearchItem[] };
}

// Basic parcel details and coordinates used when batch loading map markers
export interface ParcelPropertyItem {
  id: string;
  geometry_geojson?: string | null;
  latitude: number | null;
  longitude: number | null;
  address_zip?: string | null;
  address_state?: string | null;
  address_citytown?: string | null;
  address_street?: string | null;
  address_street_number?: string | null;
  address_unit?: string | null;
}

export interface ParcelPropertiesData {
  parcels: {
    items: ParcelPropertyItem[];
  };
}
// Grabs year_built by ID in chunks of 50
export const GET_YEAR_BUILT_BY_IDS: TypedDocumentNode<
  YearBuiltReturn,
  MassReonomyQuery
> = gql`
  query ParcelsByIds($ids: [String!]) {
    reonomyProperties(first: 50, filter: { parcel_id: { in: $ids } }) {
      items {
        parcel_id
        year_built
      }
    }
  }
`;

// Pulls detailed building specs, lot size, and up to 20 past sales for a single parcel ID
export const GET_REONOMY_PROPERTY: TypedDocumentNode<
  ReonomyQueryResponse,
  ReonomyQuery
> = gql`
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
`;

// Pulls basic parcel coordinates and addresses (used for bulk map marker loading)
export const GET_PARCEL_PROPERTIES: TypedDocumentNode<
  ParcelPropertiesData,
  OperationVariables
> = gql`
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
`;

// Searches addresses in NYC starting with a prefix string (capped at 8 results for autocomplete)
export const GET_PROPERTY_BY_ADDRESS: TypedDocumentNode<
  AddressSearchResponse,
  AddressSearchQuery
> = gql`
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
`;
