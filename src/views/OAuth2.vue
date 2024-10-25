<template>
	<span>This window should close...</span>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { useHead } from "@vueuse/head";
import { publishSelfMessage } from "./window.messages";

useHead({
	title: "7TV | Authentication (OAuth2 Callback)",
});

// There should be a token in the fragment in the form
// of `#token=...&...`

const route = useRoute();
const router = useRouter();

function handleRoute() {
	if (!window.opener) {
		router.replace("/");
		return;
	}

	// Parse the token as a URLSearchParams
	const params = new URLSearchParams(route.hash.slice(1));
	const token = params.get("token");
	const wasLinked = params.get("linked") === "true";
	const isLogout = params.get("logout") === "true";

	if (isLogout) {
		publishSelfMessage({ event: "LOGOUT_SUCCESS" });
		window.close();
		return;
	}

	if (wasLinked) {
		publishSelfMessage({ event: "LOGIN_LINKED" });
		window.close();
		return;
	}

	if (!token) {
		publishSelfMessage({ event: "LOGIN_FAILED" });
		window.close();
		return;
	}

	// Send the token back to the parent window
	publishSelfMessage({
		event: "LOGIN_TOKEN",
		token,
	});
	window.close();
}

handleRoute();
</script>
