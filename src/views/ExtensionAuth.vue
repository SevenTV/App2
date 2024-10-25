<template>
	<div class="extension-auth-content">
		<LoginButton v-if="!actor.user" />
	</div>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useActor } from "@/store/actor";
import { useStore } from "@/store/main";
import LoginButton from "@/components/utility/LoginButton.vue";

const store = useStore();
const actor = useActor();
window.addEventListener("message", function listener(e) {
	if (e.origin !== "https://www.twitch.tv") return;
	if (e.data !== "7tv-token-request") return;

	window.removeEventListener("message", listener);
	watch(
		() => store.authToken,
		(t) => {
			if (!t) return;
			e.source?.postMessage({ type: "7tv-token", token: t }, { targetOrigin: "https://www.twitch.tv/*" });
		},
		{ immediate: true },
	);
});
</script>

<style lang="scss">
nav {
	display: none;
}
.extension-auth-content {
	display: flex;
	margin: auto;
	justify-content: center;
}
</style>
