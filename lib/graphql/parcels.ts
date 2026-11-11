import { gql, OperationVariables, TypedDocumentNode } from "@apollo/client";

export interface PropertyItem {
  id: string;
  geometry_geojson: string;
  latitude: number;
  longitude: number;
  address_zip: string;
  address_state: string;
  address_citytown: string;
  address_street: string;
  address_street_number: string;
  address_unit: string;
}

export interface PropertiesData {
  parcels: {
    items: PropertyItem[];
  };
}
// Could add in // geometry_geojson

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
