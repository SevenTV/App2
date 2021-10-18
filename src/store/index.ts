import { User } from "@/structures/User";
import { Update, ApplyMutation } from "@/structures/Update";
import { InjectionKey } from "vue";
import { createStore, Store, useStore as baseUseStore } from "vuex";

export interface State {
	clientUser: User | null;
	theme: "light" | "dark";
	changeCount: number;
	lastChange: number;
	notFoundMode: "troll-despair" | null;
	navOpen: boolean;
}

export const key: InjectionKey<Store<State>> = Symbol("vuex");

export const store = createStore<State>({
	state: {
		clientUser: null,
		theme: "dark",
		changeCount: 0,
		lastChange: 0,
		notFoundMode: null,
		navOpen: false,
	},
	getters: {
		theme: (state) => state.theme,
		changeCount: (state) => state.changeCount,
		lastChange: (state) => state.lastChange,
		notFoundMode: (state) => state.notFoundMode,
		navOpen: (state) => state.navOpen,
		clientUser: (state) => state.clientUser,
	},
	mutations: {
		SET_THEME: (state, newTheme: "light" | "dark") => {
			const now = Date.now();
			if (now - state.lastChange > 2000) {
				state.changeCount = 0;
			}
			localStorage.setItem("7tv-theme", newTheme);
			state.lastChange = now;
			state.changeCount++;
			state.theme = newTheme;
		},
		SET_NOT_FOUND_MODE: (state, newMode: "troll-despair" | null) => {
			state.notFoundMode = newMode;
		},
		SET_NAV_OPEN: (state, newNavOpen: boolean) => {
			state.navOpen = newNavOpen;
		},
		SET_USER: (state: State, user: User) => (state.clientUser = user),
		UPDATE_USER: (state, update: Update) => ApplyMutation(state.clientUser, update),
	},
	actions: {},
	modules: {},
});

export const useStore = () => {
	return baseUseStore(key);
};
