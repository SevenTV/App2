<template>
	<div class="extension-auth-content">
		<LoginButton redirect />
	</div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import LoginButton from "../components/utility/LoginButton.vue";
import { useStore } from "../store/main";

const router = useRouter();
const store = useStore();
const opener = window.opener as Window;

function main() {
	if (!opener) {
		router.push("/");
	} else if (store.authToken) {
		opener.postMessage({ type: "7tv-token", token: store.authToken }, "https://www.twitch.tv");
		window.close();
	} else {
		window.sessionStorage.setItem("7tv-extension-auth", "true");
	}
}

main();
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
