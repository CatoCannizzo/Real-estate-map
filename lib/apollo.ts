import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  link: new HttpLink({ uri: 'https://graphql.eng.meridiancapital.com/graphql' }),
  cache: new InMemoryCache(),
});