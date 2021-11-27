import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
	{
		path: "/",
		name: "Home",
		component: () => import(/* webpackChunkName: "main" */ "../views/Home.vue"),
	},
	{
		path: "/emotes",
		name: "Emotes",
		component: () => import(/* webpackChunkName: "main" */ "@/views/EmoteList/EmoteList.vue"),
	},
	{
		path: "/emotes/create",
		name: "EmoteUpload",
		component: () => import(/* webpackChunkName: "main" */ "@/views/EmoteUpload/EmoteUpload.vue"),
	},
	{
		path: "/emotes/:emoteID",
		name: "Emote",
		props: true,
		component: () => import(/* webpackChunkName: "main" */ "../views/EmotePage/EmotePage.vue"),
	},
	{
		path: "/users/:userID",
		name: "User",
		props: true,
		component: () => import(/* webpackChunkName: "main" */ "../views/UserPage/UserPage.vue"),
	},
	{
		path: "/subscribe",
		name: "Subscribe",
		component: () => import(/* webpackChunkName: "main" */ "../views/Subscribe.vue"),
	},
	{
		path: "/about",
		name: "About",
		component: () => import(/* webpackChunkName: "main" */ "../views/About.vue"),
	},
	{
		path: "/admin",
		name: "Admin",
		component: () => import(/* webpackChunkName: "admin" */ "../views/Admin/Admin.vue"),
		children: [
			{
				path: "reports",
				name: "AdminReports",
				component: () => import(/* webpackChunkName: "admin" */ "../views/Admin/AdminReports.vue"),
				children: [
					{
						path: ":reportID",
						name: "AdminReportEditor",
						component: () => import(/* webpackChunkName: "admin" */ "../views/Admin/AdminReportEditor.vue"),
						props: true,
					},
				],
			},
			{
				path: "modq",
				name: "AdminModQueue",
				component: () => import(/* webpackChunkName: "admin" */ "../views/Admin/AdminModQueue.vue"),
			},
			{ path: "users", component: () => import(/* webpackChunkName: "admin" */ "../views/Admin/AdminUsers.vue") },
			{
				path: "roles",
				name: "AdminRoles",
				component: () => import(/* webpackChunkName: "admin" */ "../views/Admin/AdminRoles.vue"),
				children: [
					{
						path: ":roleID",
						component: () => import(/* webpackChunkName: "admin" */ "../views/Admin/AdminRoleEditor.vue"),
						props: true,
					},
				],
			},
			{
				path: "cosmetics",
				name: "AdminCosmetics",
				component: () => import(/* webpackChunkName: "admin" */ "../views/Admin/AdminCosmetics.vue"),
			},
			{
				path: "bans",
				name: "AdminBans",
				component: () => import(/* webpackChunkName: "admin" */ "../views/Admin/AdminBans.vue"),
			},
		],
	},
	{
		path: "/oauth2",
		name: "OAuth2Callback",
		component: () => import(/* webpackChunkName: "main" */ "../views/OAuth2.vue"),
	},
	{
		path: "/:pathMatch(.*)*",
		name: "Not Found",
		component: () => import(/* webpackChunkName: "main" */ "../views/404.vue"),
	},
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;
