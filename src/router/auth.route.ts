import { RouteRecordRaw } from "vue-router";

export const ExtensionAuthRoute = {
	path: "/extension/auth",
	name: "ExtensionAuth",
	component: () => import("@/views/ExtensionAuth.vue"),
} as RouteRecordRaw;
