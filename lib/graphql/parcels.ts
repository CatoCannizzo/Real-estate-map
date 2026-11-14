import { gql, OperationVariables, TypedDocumentNode } from "@apollo/client";

export interface PropertyItem {
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

export interface PropertiesData {
  parcels: {
    items: PropertyItem[];
  };
}

export const GET_PROPERTIES: TypedDocumentNode<
  PropertiesData,
  OperationVariables
> = gql`
  query GetProperties {
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
