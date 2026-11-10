import { gql, OperationVariables, TypedDocumentNode } from "@apollo/client";

export interface ParcelItem {
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

export interface ParcelsData {
  parcels: {
    items: ParcelItem[];
  };
}
// Could add in // geometry_geojson

export const GET_PARCELS: TypedDocumentNode<ParcelsData, OperationVariables> =
  gql`
    query GetParcels {
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
