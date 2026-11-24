/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query ParcelsByIds($ids: [String!]) {\n    reonomyProperties(first: 50, filter: { parcel_id: { in: $ids } }) {\n      items {\n        parcel_id\n        year_built\n      }\n    }\n  }\n": typeof types.ParcelsByIdsDocument,
    "\n  query GetReonomyProperty($parcel_id: String!) {\n    reonomyProperties(first: 1, filter: { parcel_id: { eq: $parcel_id } }) {\n      items {\n        parcel_id\n        address_line1\n        city\n        zip5\n        neighborhood_name\n        asset_type\n        building_area\n        lot_size_sqft\n        total_units\n        floors\n        lat\n        lon\n        year_built\n        reonomyPropertySale(first: 20) {\n          items {\n            sales_id\n            recording_date\n            sale_amount\n            price_per_building_area\n            document_type\n          }\n        }\n      }\n    }\n  }\n": typeof types.GetReonomyPropertyDocument,
    "\n  query GetParcelProperties {\n    parcels {\n      items {\n        id\n        latitude\n        longitude\n        address_zip\n        address_state\n        address_citytown\n        address_street\n        address_street_number\n        address_unit\n      }\n    }\n  }\n": typeof types.GetParcelPropertiesDocument,
    "\n  query searchAddress($prefix: String!) {\n    reonomyProperties(\n      first: 8\n      filter: {\n        address_line1: { startsWith: $prefix }\n        city: { eq: \"NEW YORK\" }\n      }\n    ) {\n      items {\n        parcel_id\n        address_line1\n        lat\n        lon\n      }\n    }\n  }\n": typeof types.SearchAddressDocument,
};
const documents: Documents = {
    "\n  query ParcelsByIds($ids: [String!]) {\n    reonomyProperties(first: 50, filter: { parcel_id: { in: $ids } }) {\n      items {\n        parcel_id\n        year_built\n      }\n    }\n  }\n": types.ParcelsByIdsDocument,
    "\n  query GetReonomyProperty($parcel_id: String!) {\n    reonomyProperties(first: 1, filter: { parcel_id: { eq: $parcel_id } }) {\n      items {\n        parcel_id\n        address_line1\n        city\n        zip5\n        neighborhood_name\n        asset_type\n        building_area\n        lot_size_sqft\n        total_units\n        floors\n        lat\n        lon\n        year_built\n        reonomyPropertySale(first: 20) {\n          items {\n            sales_id\n            recording_date\n            sale_amount\n            price_per_building_area\n            document_type\n          }\n        }\n      }\n    }\n  }\n": types.GetReonomyPropertyDocument,
    "\n  query GetParcelProperties {\n    parcels {\n      items {\n        id\n        latitude\n        longitude\n        address_zip\n        address_state\n        address_citytown\n        address_street\n        address_street_number\n        address_unit\n      }\n    }\n  }\n": types.GetParcelPropertiesDocument,
    "\n  query searchAddress($prefix: String!) {\n    reonomyProperties(\n      first: 8\n      filter: {\n        address_line1: { startsWith: $prefix }\n        city: { eq: \"NEW YORK\" }\n      }\n    ) {\n      items {\n        parcel_id\n        address_line1\n        lat\n        lon\n      }\n    }\n  }\n": types.SearchAddressDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ParcelsByIds($ids: [String!]) {\n    reonomyProperties(first: 50, filter: { parcel_id: { in: $ids } }) {\n      items {\n        parcel_id\n        year_built\n      }\n    }\n  }\n"): (typeof documents)["\n  query ParcelsByIds($ids: [String!]) {\n    reonomyProperties(first: 50, filter: { parcel_id: { in: $ids } }) {\n      items {\n        parcel_id\n        year_built\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetReonomyProperty($parcel_id: String!) {\n    reonomyProperties(first: 1, filter: { parcel_id: { eq: $parcel_id } }) {\n      items {\n        parcel_id\n        address_line1\n        city\n        zip5\n        neighborhood_name\n        asset_type\n        building_area\n        lot_size_sqft\n        total_units\n        floors\n        lat\n        lon\n        year_built\n        reonomyPropertySale(first: 20) {\n          items {\n            sales_id\n            recording_date\n            sale_amount\n            price_per_building_area\n            document_type\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetReonomyProperty($parcel_id: String!) {\n    reonomyProperties(first: 1, filter: { parcel_id: { eq: $parcel_id } }) {\n      items {\n        parcel_id\n        address_line1\n        city\n        zip5\n        neighborhood_name\n        asset_type\n        building_area\n        lot_size_sqft\n        total_units\n        floors\n        lat\n        lon\n        year_built\n        reonomyPropertySale(first: 20) {\n          items {\n            sales_id\n            recording_date\n            sale_amount\n            price_per_building_area\n            document_type\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetParcelProperties {\n    parcels {\n      items {\n        id\n        latitude\n        longitude\n        address_zip\n        address_state\n        address_citytown\n        address_street\n        address_street_number\n        address_unit\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetParcelProperties {\n    parcels {\n      items {\n        id\n        latitude\n        longitude\n        address_zip\n        address_state\n        address_citytown\n        address_street\n        address_street_number\n        address_unit\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query searchAddress($prefix: String!) {\n    reonomyProperties(\n      first: 8\n      filter: {\n        address_line1: { startsWith: $prefix }\n        city: { eq: \"NEW YORK\" }\n      }\n    ) {\n      items {\n        parcel_id\n        address_line1\n        lat\n        lon\n      }\n    }\n  }\n"): (typeof documents)["\n  query searchAddress($prefix: String!) {\n    reonomyProperties(\n      first: 8\n      filter: {\n        address_line1: { startsWith: $prefix }\n        city: { eq: \"NEW YORK\" }\n      }\n    ) {\n      items {\n        parcel_id\n        address_line1\n        lat\n        lon\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;