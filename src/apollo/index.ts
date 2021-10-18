import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client/core";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { sha256 } from "crypto-hash";

// HTTP connection to the API
const httpLink = createHttpLink({
	// You should use an absolute URL here
	uri: `${import.meta.env.VITE_APP_API_GQL}/v3`,
	headers: {
		Authorization: `Bearer ${localStorage.getItem("token")}`,
	},
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
