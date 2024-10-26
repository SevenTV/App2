import { defineStore } from "pinia";
import { LocalStorageKeys } from "@store/lskeys";
import { correctLocale } from "@/i18n";
import { EmoteSet } from "@/structures/EmoteSet";
import { Role } from "@/structures/Role";

export interface State {
	refreshAuth: boolean;
	authToken: string | null;
	theme: Theme;
	seasonalTheme: boolean;
	themeTimestamp: number;
	lastChange: number;
	notFoundMode: NotFoundMode | null;
	navOpen: boolean;
	noTransitions: boolean;
	namedSets: {
		global: [EmoteSet | null, Record<string, boolean>];
	};
	roles: Record<string, Role>;
	locale: string;
	faPro: boolean;
}

const getBrowserLocale = () => {
	const navigatorLocale = navigator.languages !== undefined ? navigator.languages[0] : navigator.language;

	if (!navigatorLocale) {
		return undefined;
	}

	return navigatorLocale.trim().replace("-", "_").toLowerCase();
};

export const useStore = defineStore("main", {
	state: () =>
		({
			refreshAuth: true,
			authToken: window.localStorage.getItem(LocalStorageKeys.AUTH_TOKEN) || null,
			theme: (localStorage.getItem(LocalStorageKeys.THEME) || "dark") as Theme,
			seasonalTheme: false,
			themeTimestamp: parseInt(localStorage.getItem(LocalStorageKeys.THEME_TIMESTAMP ?? "0") as string),
			locale: correctLocale(localStorage.getItem(LocalStorageKeys.LOCALE) || getBrowserLocale() || "en_US"),
			lastChange: 0,
			notFoundMode: null,
			navOpen: false,
			noTransitions: false,
			namedSets: {
				global: [null, {}],
			},
			roles: {},
			faPro: import.meta.env.VITE_APP_FA_PRO === "true",
		} as State),
	getters: {
		getTheme: (state) => state.theme as Theme,
		getLastChange: (state) => state.lastChange,
		getNotFoundMode: (state) => state.notFoundMode,
		getNavOpen: (state) => state.navOpen,
		getNoTransitions: (state) => state.noTransitions,
		roleList: (state): Role[] => Object.keys(state.roles).map((k) => state.roles[k]),
	},
	actions: {
		setAuthToken(token: string | null, refresh = true) {
			this.authToken = token;
			this.refreshAuth = refresh;
			if (token) {
				localStorage.setItem(LocalStorageKeys.AUTH_TOKEN, token);
			} else {
				localStorage.removeItem(LocalStorageKeys.AUTH_TOKEN);
			}
		},
		setTheme(newTheme: Theme) {
			const now = Date.now();
			this.noTransitions = true;
			localStorage.setItem(LocalStorageKeys.THEME, newTheme);

			window.requestAnimationFrame(() => {
				this.lastChange = now;
				this.theme = newTheme;
				window.requestAnimationFrame(() => {
					this.noTransitions = false;
				});
			});
			this.setThemeTimestamp(Date.now());
		},
		setSeasonalTheme(value: boolean) {
			this.seasonalTheme = value;
			localStorage.setItem(LocalStorageKeys.SEASONAL_THEME, String(value));
			this.setThemeTimestamp(Date.now());
		},
		setThemeTimestamp(value: number) {
			this.themeTimestamp = value;
			localStorage.setItem(LocalStorageKeys.THEME_TIMESTAMP, String(value));
		},
		setNotFoundMode(newMode: NotFoundMode | null) {
			this.notFoundMode = newMode;
		},
		setNavOpen(newNavOpen: boolean) {
			this.navOpen = newNavOpen;
		},
		setGlobalEmoteSet(set: EmoteSet) {
			this.namedSets.global[0] = set;
			this.namedSets.global[1] = set.emotes.map((ae) => ({ [ae.id]: true })).reduce((a, b) => ({ ...a, ...b }));
		},
		setRoleList(roles: Role[]) {
			this.roles = roles.map((r) => ({ [r.id]: r })).reduce((a, b) => ({ ...a, ...b }));
		},
		setLocale(newLocale: string) {
			newLocale = correctLocale(newLocale);
			this.locale = newLocale;
			localStorage.setItem(LocalStorageKeys.LOCALE, newLocale);
		},
	},
});

setInterval(() => {
	const token = localStorage.getItem(LocalStorageKeys.AUTH_TOKEN);
	const store = useStore();
	if (token !== store.authToken) {
		store.setAuthToken(token);
	}
}, 1000);

export type Theme = "light" | "dark";
export type NotFoundMode = "troll-despair" | "pot-friend";
