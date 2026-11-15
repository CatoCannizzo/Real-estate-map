import { gql, OperationVariables, TypedDocumentNode } from "@apollo/client";

interface ReonomyQuery {
  parcel_id: string;
}

interface ReonomyQueryResponse {
  reonomyProperties: { items: ReonomyPropertyItem[] };
}
export interface SaleRecord {
  sales_id: string;
  recording_date?: string;
  sale_amount?: number;
  price_per_building_area?: number;
  document_type?: string;
}

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
