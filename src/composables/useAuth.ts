import { useStore } from "@/store/main";
import { User } from "@/structures/User";

let authWindow = null as WindowProxy | null;

function popup(route: string): Promise<void> {
	if (authWindow && !authWindow.closed) {
		authWindow.close();
	}

	const popup = window.open(
		`${import.meta.env.VITE_APP_API_REST}/${route}`,
		"seventv-oauth2",
		"_blank, width=850, height=650, menubar=no, location=no",
	);

	authWindow = popup;

	if (!popup) {
		return Promise.reject("Failed to open window");
	}

	return new Promise((resolve) => {
		const i = setInterval(async () => {
			if (!popup.closed) {
				return;
			}

			clearInterval(i);
			resolve();
		}, 100);
	});
}

export function useAuth() {
	function prompt(provider: User.Connection.Platform, isLink: boolean): Promise<void> {
		const store = useStore();

		return popup(
			`auth?platform=${provider.toLowerCase()}` +
				(store.authToken ? `&token=${store.authToken}` : "") +
				(isLink ? "&link_connection=true" : ""),
		);
	}

	function logout(): Promise<void> {
		const store = useStore();
		return popup("auth/logout" + (store.authToken ? `?token=${store.authToken}` : ""));
	}

	return {
		prompt,
		logout,
	};
}
