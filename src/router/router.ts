import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";
import { AdminRoute } from "./admin.route";
import { ExtensionAuthRoute } from "./auth.route";
import { CallbackRoute } from "./callback.route";
import { EmoteSetRoute } from "./emote-sets.route";
import { EmotesRoute } from "./emotes.route";
import { HelpRoute } from "./help.route";
import { HomeRoute } from "./home.route";
import { LegalRoute } from "./legal.route";
import { StoreRoute } from "./store.route";
import { UsersRoute } from "./users.route";

const routes: Array<RouteRecordRaw> = [
	HomeRoute,
	...EmotesRoute,
	...UsersRoute,
	...LegalRoute,
	EmoteSetRoute,
	StoreRoute,
	HelpRoute,
	AdminRoute,
	...CallbackRoute,
	ExtensionAuthRoute,
	{
		path: "/:pathMatch(.*)*",
		name: "Not Found",
		component: () => import("@/views/404.vue"),
	},
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;
