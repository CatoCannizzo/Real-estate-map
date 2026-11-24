import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  //GraphQl endpoint
  schema: "https://graphql.eng.meridiancapital.com/graphql",
  //GraphQl calls
  documents: ["lib/graphql/queries.ts", "components/map/*{.ts}"],
  // Output location:
  generates: {
    "lib/graphql/generated/": {
      preset: "client",
      presetConfig: {
        gqlTagName: "graphql",
      },
    },
  },
};
export default config;
