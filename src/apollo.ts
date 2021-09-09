import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client/core";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { sha256 } from "crypto-hash";

// HTTP connection to the API
const httpLink = createHttpLink({
	// You should use an absolute URL here
	uri: `${process.env.VUE_APP_API}/v3/gql`,
}).concat(
	createPersistedQueryLink({
		sha256,
		useGETForHashedQueries: true,
	})
);

// Cache implementation
const cache = new InMemoryCache();

// Create the apollo client
export const apolloClient = new ApolloClient({
	link: httpLink,
	cache,
});
