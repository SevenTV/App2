import { useStore } from "@/store/main";
import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client/core";
import { BatchHttpLink } from "@apollo/client/link/batch-http";

// HTTP connection to the API
const httpLink = new BatchHttpLink({
	// You should use an absolute URL here
	uri: `${import.meta.env.VITE_APP_API_GQL}`,
	credentials: "include",
	batchMax: 20,
	batchInterval: 20,
});

let cycleDetected = false;

const authLink = new ApolloLink((operation, forward) => {
	const store = useStore();

	// Use the setContext method to set the HTTP headers.
	operation.setContext({
		headers: store.authToken
			? {
					authorization: `Bearer ${store.authToken}`,
					// Allows to ignore auth failures and still get a response
					"x-ignore-auth-failure": "true",
			  }
			: {},
	});

	// Call the next link in the middleware chain.
	return forward(operation).map((response) => {
		const { response: resp } = operation.getContext();

		if (resp?.headers) {
			const authFailure = resp.headers.get("x-auth-failure") === "true";
			if (authFailure) {
				if (!cycleDetected) {
					store.setAuthToken(null);
					cycleDetected = true;
				}
			} else {
				cycleDetected = false;
			}
		}

		return response;
	});
});

const link = ApolloLink.from([authLink, httpLink]);

// Cache implementation
const cache = new InMemoryCache({
	typePolicies: {
		User: {
			fields: {
				roles: {
					merge(_, b) {
						return b;
					},
				},
			},
		},
		EmoteSet: {
			fields: {
				emotes: {
					merge(_, b) {
						return b;
					},
				},
			},
		},
		ChangeMap: {
			fields: {
				pulled: {
					merge(_, b) {
						return b;
					},
				},
				pushed: {
					merge(_, b) {
						return b;
					},
				},
			},
		},
	},
});

// Create the apollo client
export const apolloClient = new ApolloClient({
	link: link,
	cache,
	defaultOptions: {
		watchQuery: {
			fetchPolicy: "no-cache",
		},
		query: {
			fetchPolicy: "no-cache",
		},
	},
});
