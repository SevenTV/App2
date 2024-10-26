<template>
	<span>This window should close...</span>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { useHead } from "@vueuse/head";
import { publishMessage } from "./window.messages";
import { useStore } from "../store/main";

useHead({
	title: "7TV | Authentication (OAuth2 Callback)",
});

// There should be a token in the fragment in the form
// of `#token=...&...`

const route = useRoute();
const router = useRouter();
const opener = window.opener as Window;

function handleRoute() {
	if (!opener) {
		router.replace("/");
		return;
	}

	const params = new URLSearchParams(route.hash.slice(1));
	const token = params.get("token");

	let is7TV;
	try {
		is7TV = opener.location.origin === window.origin;
	} catch (e) {
		is7TV = false;
	}

	if (is7TV) {
		const wasLinked = params.get("linked") === "true";
		const isLogout = params.get("logout") === "true";

		// Parse the token as a URLSearchParams

		if (isLogout) {
			publishMessage({ event: "LOGOUT_SUCCESS" });
			window.close();
			return;
		}

		if (wasLinked) {
			publishMessage({ event: "LOGIN_LINKED" });
			window.close();
			return;
		}

		if (!token) {
			publishMessage({ event: "LOGIN_FAILED" });
			window.close();
			return;
		}

		// Send the token back to the parent window
		publishMessage({
			event: "LOGIN_TOKEN",
			token,
		});
	} else if (token && window.sessionStorage.getItem("7tv-extension-auth") === "true") {
		const store = useStore();
		store.setAuthToken(token);
		opener.postMessage({ type: "7tv-token", token }, "https://www.twitch.tv");
	}

	window.close();
}

handleRoute();
</script>
