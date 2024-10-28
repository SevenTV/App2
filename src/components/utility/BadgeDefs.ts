import { Component } from "vue";
import { useActor } from "@/store/actor";
import { Badge } from "@/structures/Cosmetic";
import BgBadge1VueSvg from "@/components/base/BgBadge1.vue";
import BgBadge2VueSvg from "@/components/base/BgBadge2.vue";
import BgBadge3VueSvg from "@/components/base/BgBadge3.vue";
import BgBadge4VueSvg from "@/components/base/BgBadge4.vue";
import BgBadgeTranslatorVueSvg from "@/components/base/BgBadgeTranslator.vue";
import BgBadgeXmasGifterVueSvg from "@/components/base/BgBadgeXmasGifter.vue";

function monthToDays(months: number): number {
	return Math.floor((months - 1) * (365.25 / 12));
}

const actor = useActor();

const ext = actor.avifSupported ? "avif" : "webp";

export const badgeDefs = [
	{
		id: "sub1",
		name: "1 Month",
		sub: true,
		days: monthToDays(1),
		logo: { color: "#18181b" },
		border: { color: "transparent" },
		background: {
			gradient: {
				angle: 45,
				stops: [
					{ color: "#fee029", offset: 0 },
					{ color: "#ff7f21", offset: 1 },
				],
			},
		},
	},
	{
		id: "sub2",
		name: "2 Months",
		sub: true,
		days: monthToDays(2),
		logo: { color: "#18181b" },
		border: { color: "transparent" },
		background: {
			gradient: {
				angle: 45,
				stops: [
					{ color: "#ffb400", offset: 0 },
					{ color: "#f0106d", offset: 1 },
				],
			},
		},
	},
	{
		id: "sub3",
		name: "3 Months",
		sub: true,
		days: monthToDays(3),
		logo: { color: "#18181b" },
		border: { color: "transparent" },
		background: {
			gradient: {
				angle: 45,
				stops: [
					{ color: "#ff256b", offset: 0 },
					{ color: "#a60a4b", offset: 1 },
				],
			},
		},
	},
	{
		id: "sub6",
		name: "6 Months",
		sub: true,
		days: monthToDays(6),
		logo: { color: "#18181b" },
		border: { color: "transparent" },
		background: {
			gradient: {
				angle: 45,
				stops: [
					{ color: "#ff447c", offset: 0 },
					{ color: "#9704fd", offset: 1 },
				],
			},
		},
	},
	{
		id: "sub9",
		name: "9 Months",
		sub: true,
		days: monthToDays(9),
		logo: { color: "#18181b" },
		border: { color: "transparent" },
		background: {
			gradient: {
				angle: 45,
				stops: [
					{ color: "#02e5f8", offset: 0 },
					{ color: "#664eee", offset: 1 },
				],
			},
		},
	},
	{
		id: "sub12",
		name: "1 Year",
		sub: true,
		days: monthToDays(12),
		logo: { color: "#18181b" },
		border: { color: "transparent" },
		background: {
			component: BgBadge1VueSvg,
		},
	},
	{
		id: "sub15",
		name: "1.25 Years",
		sub: true,
		days: monthToDays(15),
		logo: { color: "#18181b" },
		border: { color: "transparent" },
		background: {
			component: BgBadge2VueSvg,
		},
	},
	{
		id: "sub18",
		name: "1.5 Years",
		sub: true,
		days: monthToDays(18),
		logo: { color: "#ffffff" },
		border: { color: "transparent" },
		background: {
			component: BgBadge3VueSvg,
		},
	},
	{
		id: "sub21",
		name: "1.75 Years",
		sub: true,
		days: monthToDays(21),
		logo: { color: "#ffffff" },
		border: { color: "transparent" },
		background: {
			component: BgBadge4VueSvg,
		},
	},
	{
		id: "sub24",
		name: "2 Years",
		sub: true,
		days: monthToDays(24),
		img: `${import.meta.env.VITE_APP_CDN}/badge/64dfeec02040c6754787d929/4x.${ext}`,
	},
	{
		id: "sub27",
		name: "2.25 Years",
		sub: true,
		days: monthToDays(27),
		img: `${import.meta.env.VITE_APP_CDN}/badge/64dff4652040c6754787d92a/4x.${ext}`,
	},
	{
		id: "sub30",
		name: "2.5 Years",
		sub: true,
		days: monthToDays(30),
		img: `${import.meta.env.VITE_APP_CDN}/badge/64dff95e2040c6754787d92f/4x.${ext}`,
	},
	{
		id: "sub33",
		name: "2.75 Years",
		sub: true,
		days: monthToDays(33),
		img: `${import.meta.env.VITE_APP_CDN}/badge/64dff9c32040c6754787d930/4x.${ext}`,
	},
	{
		id: "sub36",
		name: "3 Years",
		sub: true,
		days: monthToDays(36),
		img: `${import.meta.env.VITE_APP_CDN}/badge/01JAT9B20KQK8DK8FT13XV83YC/4x.${ext}`,
	},
	{
		id: "sub39",
		name: "3.25 Years",
		sub: true,
		days: monthToDays(39),
		img: `${import.meta.env.VITE_APP_CDN}/badge/01JAT9BASQDPE5VV0PMXRYND9E/4x.${ext}`,
	},
	{
		id: "sub39",
		name: "3.5 Years",
		sub: true,
		days: monthToDays(42),
		img: `${import.meta.env.VITE_APP_CDN}/badge/01JAT9BH1BBRB8Q45AJVVND54R/4x.${ext}`,
	},
	{
		id: "sub45",
		name: "3.75 Years",
		sub: true,
		days: monthToDays(45),
		img: `${import.meta.env.VITE_APP_CDN}/badge/01JAT9BPCRSDK1BQSM17278GJN/4x.${ext}`,
	},
	{
		id: "subfounder",
		name: "Founder",
		sub: false,
		background: { color: "#18181b" },
		logo: { color: "#ffffff" },
		border: {
			gradient: {
				angle: 45,
				stops: [
					{ color: "#fee029", offset: 0 },
					{ color: "#ff7f21", offset: 1 },
				],
			},
		},
	},
	{
		id: "xmasgift",
		name: "XMAS Gifter",
		sub: false,
		logo: {
			color: "#18181b",
		},
		background: {
			component: BgBadgeXmasGifterVueSvg,
		},
	},
	{
		id: "xsubtember23",
		name: "Sub Event 2023",
		sub: false,
		img: `${import.meta.env.VITE_APP_CDN}/badge/6508d5bd55deb74f50368f40/4x.${ext}`,
	},
	{
		id: "nnys2023",
		name: "7TV x NNYS 2023",
		sub: false,
		img: `${import.meta.env.VITE_APP_CDN}/badge/65786330ffc9d968e5102164/4x.${ext}`,
	},
	{
		id: "contributor",
		background: { color: "#18181b" },
		logo: { color: "#ffffff" },
		border: {
			gradient: {
				angle: 45,
				stops: [
					{ color: "#11F9ED", offset: 0 },
					{ color: "#48EE66", offset: 1 },
				],
			},
		},
	},
	{
		id: "translator",
		name: "Translator",
		logo: { color: "#ffffff" },
		background: {
			component: BgBadgeTranslatorVueSvg,
		},
	},
	{
		id: "mod",
		name: "Moderator",
		background: { color: "#18181b" },
		logo: {
			gradient: {
				angle: 22.5,
				stops: [
					{ color: "#3dc917", offset: 0 },
					{ color: "#01839c", offset: 1 },
				],
			},
		},
	},
	{
		id: "events",
		name: "Event Coordinator",
		background: { color: "#18181b" },
		logo: {
			gradient: {
				angle: 45,
				stops: [
					{ color: "#ffbf00", offset: 0 },
					{ color: "#9b06f8", offset: 1 },
				],
			},
		},
	},
	{
		id: "admin",
		name: "Admin",
		background: { color: "#18181b" },
		logo: {
			gradient: {
				angle: 45,
				stops: [
					{ color: "#db248d", offset: 0 },
					{ color: "#ff1a00", offset: 1 },
				],
			},
		},
	},
	{
		id: "kathy",
		background: { color: "#18181b" },
		logo: {
			gradient: {
				angle: 45,
				stops: [
					{ color: "#ff72e8", offset: 0 },
					{ color: "#ff0b64", offset: 1 },
				],
			},
		},
	},
] as BadgeDef[];

export const getBadgeByID = (id: string, refID?: string, badge?: Badge) => {
	let x = badgeDefs.find((b) => b.id === id || (refID && b.refID === refID));

	if (!x && badge) {
		x = {
			id: badge.id,
			name: badge.name,
			background: {},
			logo: {},
			border: {},
			img: `${import.meta.env.VITE_APP_CDN}/badge/${badge.id}/4x.${ext}`,
		} as BadgeDef;
	}

	if (refID && x) {
		x.refID = refID;
	}

	return x;
};

export const getNearestBadgeByAge = (age: number): BadgeDef | null => {
	return badgeDefs
		.filter((b) => b.sub)
		.reduce((prev, curr) => (Math.abs(age - (curr?.days ?? 0)) < Math.abs(age - (prev?.days ?? 0)) ? curr : prev));
};

export const getNextBadge = (id: string, sub?: boolean): BadgeDef | null => {
	let result = null as BadgeDef | null;

	badgeDefs.find((b, index) => {
		if (sub && !b.sub) {
			return;
		}

		if (b.id === id) {
			result = badgeDefs[index + 1];
		}
	});

	if (sub && !result?.sub) {
		result = null;
	}

	return result;
};

export interface BadgeDef {
	id: string;
	refID?: string;
	name: string;
	sub?: boolean;
	days?: number;
	img?: string;
	background: {
		color?: string;
		component?: Component;
		gradient?: GradientDef;
	};
	logo: {
		color: string;
		gradient?: GradientDef;
	};
	border: {
		color?: string;
		gradient?: GradientDef;
	};
}

export interface GradientDef {
	angle: number;
	stops: {
		offset: number;
		color: string;
		opacity?: number;
	}[];
}
