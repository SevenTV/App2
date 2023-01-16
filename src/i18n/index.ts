import { createI18n } from "vue-i18n";
import { LocalStorageKeys } from "@store/lskeys";
import en_US from "@locale/en_US";
import manifest from "@locale/manifest";

const localeWL = import.meta.env.VITE_APP_LOCALES?.split(",") ?? [];
export const options = Object.keys(manifest)
	.filter((k) => k !== "type" && localeWL.includes(k))
	.reduce((m, v) => {
		m[v] = manifest[v].name;
		return m;
	}, {} as { [key: string]: string });

const getBrowserLocale = () => {
	let locale: string;
	const setting = localStorage.getItem(LocalStorageKeys.LOCALE);
	if (setting) {
		locale = setting;
	} else {
		const navigatorLocale = navigator.languages !== undefined ? navigator.languages[0] : navigator.language;

		if (!navigatorLocale) {
			return "en_US";
		}

		locale = navigatorLocale;
	}

	locale = locale.trim().replace("-", "_").toLowerCase();
	if (!(locale in options)) {
		return "en_US";
	}

	return locale;
};

const l = getBrowserLocale();

export const i18n = createI18n({
	legacy: false,
	globalInjection: true,
	locale: l,
	fallbackLocale: "en_US",
	silentTranslationWarn: !import.meta.env.DEV,
	silentFallbackWarn: !import.meta.env.DEV,
	warnHtmlMessage: import.meta.env.DEV,
	messages: {
		en_US,
	},
});

export const correctLocale = (locale: string) => {
	const splits = locale.split("_");
	if (splits.length < 2) {
		splits[0] = "en";
		splits[1] = "US";
	}

	return `${splits[0]}_${splits[1].toUpperCase()}`;
};
