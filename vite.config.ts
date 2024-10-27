import { version } from "./package.json";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default ({ mode }) => {
	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_VERSION: version,
	};

	return defineConfig({
		build: {
			sourcemap: true,
			target: "es2021",
			rollupOptions: {
				plugins: [visualizer()],
				output: {
					manualChunks: {
						vendor: ["vue", "vue-router", "vue-i18n", "vue-cookie-next"],
						gql: ["subscriptions-transport-ws", "graphql"],
						apollo: ["apollo-link-context", "@vue/apollo-composable"],
						fa: [
							"@fortawesome/fontawesome-svg-core",
							"@fortawesome/free-brands-svg-icons",
							"@fortawesome/free-regular-svg-icons",
							"@fortawesome/sharp-solid-svg-icons",
							"@fortawesome/vue-fontawesome",
						],
						routing: [
							"./src/router/router.ts",
							"./src/router/home.route.ts",
							"./src/router/emotes.route.ts",
							"./src/router/emote-sets.route.ts",
							"./src/router/legal.route.ts",
							"./src/router/users.route.ts",
							"./src/router/store.route.ts",
							"./src/router/admin.route.ts",
						],
					},
				},
			},
		},
		plugins: [vue()],
		server: {
			port: 4200,
		},
		resolve: {
			alias: {
				"@": resolve(__dirname, "src"),
				"@store": resolve(__dirname, "src/store"),
				"@scss": resolve(__dirname, "src/assets/scss"),
				"@gql": resolve(__dirname, "src/assets/gql"),
				"@components": resolve(__dirname, "src/components"),
				"@base": resolve(__dirname, "src/components/base"),
				"@utility": resolve(__dirname, "src/components/utility"),
				"@directives": resolve(__dirname, "src/directives"),
				"@structures": resolve(__dirname, "src/structures"),
				"@views": resolve(__dirname, "src/views"),
				"@img": resolve(__dirname, "src/assets/img"),
				"@locale": resolve(__dirname, "locale"),
			},
		},
	});
};
