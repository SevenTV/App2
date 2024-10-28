<template>
	<main v-if="ctx.user" class="user-settings">
		<div class="user-settings-form">
			<h2>{{ t("user.settings.section_profile") }}</h2>
			<section class="user-settings-section">
				<UserProfileSettings :form="form" :user="ctx.user" @set-field="onFormUpdate" />
				<Button v-if="canEntitle" label="Add Entitlement" color="primary" @click="openEntitlementModal" />
			</section>

			<h2>{{ t("user.settings.section_badges") }}</h2>

			<div class="user-wardrobe">
				<!-- Badge Selector -->
				<div class="badge-selector">
					<div class="badge-item no-badge" :selected="form.selected_badge === 'none' || !form.selected_badge">
						<AnnotatedBadge
							:selected="form.selected_badge === 'none' || !form.selected_badge"
							size="4rem"
							:badge="{
								id: '0',
								name: 'No Badge',
								background: { color: 'transparent' },
								logo: { color: 'transparent' },
								border: { color: 'currentColor' },
							}"
							@click="onFormUpdate('selected_badge', 'none')"
						/>
					</div>

					<div
						v-for="badge of cosmetics.badges"
						:key="badge.id"
						class="badge-item"
						:selected="form.selected_badge === badge.refID"
						@click="onFormUpdate('selected_badge', badge.refID ?? '')"
					>
						<AnnotatedBadge :selected="form.selected_badge === badge.refID" :badge="badge" size="4rem" />
					</div>
				</div>
				<div v-if="false">
					{{ t("user.settings.no_badges") }}
				</div>
			</div>

			<h2>{{ t("user.settings.section_paints") }}</h2>
			<div class="user-wardrobe">
				<div class="paint-selector">
					<!-- No Paint -->
					<div
						class="paint-item"
						:selected="form.selected_paint === 'none' || !form.selected_paint"
						@click="onFormUpdate('selected_paint', 'none')"
					>
						No Paint
					</div>

					<div
						v-for="paint of cosmetics.paints"
						:key="paint.id"
						class="paint-item"
						:selected="form.selected_paint === paint.id"
						@click="onFormUpdate('selected_paint', paint.id)"
					>
						<span>
							<Icon icon="check" />
						</span>
						<PaintComponent :paint="paint" size="2rem" :text="true">
							<span>{{ paint.name }}</span>
						</PaintComponent>
					</div>
				</div>
				<div v-if="false">
					{{ t("user.settings.no_paints") }}
				</div>
			</div>
		</div>

		<!-- Submit Button -->
		<div class="user-settings-actions">
			<Button
				class="submit-button"
				:disabled="uploading || pristine"
				:label="t('common.reset').toUpperCase()"
				color="warning"
				@click="() => reset()"
			/>
			<Button
				class="submit-button"
				:disabled="uploading || pristine"
				:label="t('common.save_changes').toUpperCase()"
				color="primary"
				@click="submit"
			/>
		</div>
	</main>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuery } from "@vue/apollo-composable";
import { useActor } from "@/store/actor";
import { useModal } from "@/store/modal";
import { useMutationStore } from "@/store/mutation";
import { GetCosmetics } from "@/apollo/query/cosmetics.query";
import { GetUserCosmetics } from "@/apollo/query/user-self.query";
import { GetUser } from "@/apollo/query/user.query";
import type { Paint } from "@/structures/Cosmetic";
import { Permissions } from "@/structures/Role";
import { useContext } from "@/composables/useContext";
import { BadgeDef, getBadgeByID } from "@/components/utility/BadgeDefs";
import Button from "@/components/utility/Button.vue";
import Icon from "@/components/utility/Icon.vue";
import UserEntitlementModal from "./UserEntitlementModal.vue";
import UserCosmeticsUpdateModal from "./UserSettingsCosmeticsUpdateModal.vue";
import UserProfileSettings from "./UserSettingsProfile.vue";
import { useStore } from "../../store/main";
import ModalError from "../../components/modal/ModalError.vue";
import AnnotatedBadge from "../store/AnnotatedBadge.vue";

export interface FormType {
	username: string | null;
	display_name: string | null;
	profile_picture: ArrayBuffer | null;
	selected_paint: string | null;
	selected_badge: string | null;
}

const PaintComponent = defineAsyncComponent(() => import("@/components/utility/Paint.vue"));

const { t } = useI18n();

const pristine = ref(true);
const form = reactive({
	username: null,
	display_name: null,
	profile_picture: null,
	selected_badge: null,
	selected_paint: null,
} as FormType);

const onFormUpdate = <T extends keyof FormType>(key: T, value: FormType[T]) => {
	form[key] = value;
	pristine.value = false;
};

const ctx = useContext("USER");
if (!ctx?.user) throw new Error("No user context provided");

const actor = useActor();

// Fetch user's owned cosmetics
const { onResult: onCosmetics, refetch } = useQuery<GetUser>(
	GetUserCosmetics,
	() => ({ id: ctx.user.id }),
	() => ({ debounce: 500, enabled: !!ctx.user }),
);

const cosmetics = reactive({
	badges: [] as BadgeDef[],
	paints: [] as Paint[],
});

const canEntitle = computed(() => actor.hasPermission(Permissions.ManageEntitlements));
const query = useQuery<GetCosmetics>(
	GetCosmetics,
	() => ({}),
	() => ({ enabled: canEntitle.value }),
);

const openEntitlementModal = () => {
	if (!query.result.value) return;

	useModal().open("entitlement-confirm", {
		component: UserEntitlementModal,
		events: { close: refetch },
		props: {
			userId: ctx.user.id,
			cosmetics: query.result.value?.cosmetics,
			owned: cosmetics,
		},
	});
};

onCosmetics(async (res) => {
	if (!res.data.user) {
		return;
	}

	const data = await actor.fetchCosmeticData(res.data.user.cosmetics.map((cos) => cos.id)).then((g) => g?.cosmetics);

	cosmetics.badges = (data?.badges ?? [])
		.map((badge) => getBadgeByID(badge.tag, badge.id, badge))
		.filter((x) => x) as BadgeDef[];
	cosmetics.paints = data?.paints ?? [];

	if (cosmetics.badges.length === 0) {
		useModal().open("ErrorModal", {
			component: ModalError,
			events: {},
			props: {
				error: "No Cosmetics",
				detail: "Subscriber-only cosmetics, such as paints and badges, are only visible while you have an active subscription. These items aren't lost if your subscription expires — they'll simply become visible again when you resubscribe.",
				code: 0,
			},
		});
	}

	form.selected_badge = res.data.user.cosmetics.filter((x) => x.kind === "BADGE").find((x) => x.selected)?.id ?? "";
	form.selected_paint = res.data.user.cosmetics.filter((x) => x.kind === "PAINT").find((x) => x.selected)?.id ?? "";
});

const uploading = ref(false);

const store = useStore();

const m = useMutationStore();
const submit = async () => {
	if (!actor.user || uploading.value) {
		return; // user must be logged in to do this
	}

	const tgt = actor.user.id === ctx.user.id ? "@me" : ctx.user.id;

	// Upload profile pic
	if (form.profile_picture) {
		uploading.value = true;

		const req = new XMLHttpRequest();
		req.open("PUT", `${import.meta.env.VITE_APP_API_REST as string}/users/${tgt}/profile-picture`, true);
		req.setRequestHeader("Content-Length", form.profile_picture.byteLength.toString(10));
		if (store.authToken) {
			req.setRequestHeader("Authorization", `Bearer ${store.authToken}`);
		}

		req.withCredentials = true;
		// req.upload.onprogress = (progress) => {}; // TODO: show upload progress

		req.send(form.profile_picture);
		await new Promise<void>((resolve) => {
			req.onload = () => {
				if (req.status !== 200) {
					// TODO: show error
				}

				uploading.value = false;
				resolve(undefined);
			};
		});
	}

	let cosmeticsUpdated = false;
	if (form.selected_badge) {
		const cosID = form.selected_badge === "none" ? "000000000000000000000000" : form.selected_badge;
		await m
			.editUserCosmetics(ctx.user.id, { id: cosID, kind: "BADGE", selected: true })
			.then(() => (cosmeticsUpdated = true))
			.catch(actor.showErrorModal);
	}

	if (form.selected_paint) {
		const cosID = form.selected_paint === "none" ? "000000000000000000000000" : form.selected_paint;
		await m
			.editUserCosmetics(ctx.user.id, { id: cosID, kind: "PAINT", selected: true })
			.then(() => (cosmeticsUpdated = true))
			.catch(actor.showErrorModal);
	}

	if (cosmeticsUpdated) {
		useModal().open("cosmetics-update-ok", {
			component: UserCosmeticsUpdateModal,
			events: {},
			props: {},
		});
	}

	pristine.value = true;

	refetch();
};

// Reset some or all form fields to their default value
const reset = (fields?: (keyof FormType)[]) => {
	const fieldList = fields?.length ? fields : (Object.keys(form) as unknown as (keyof FormType)[]);

	for (const f of fieldList) {
		form[f] = null;
	}
};
</script>

<style scoped lang="scss">
@import "@scss/themes.scss";

main.user-settings {
	display: flex;
	flex-direction: column;
	width: 100%;

	> .user-settings-form {
		height: 100%;
		width: calc(100%);

		@include themify() {
			background-color: lighten(themed("backgroundColor"), 1);

			> h2 {
				color: mix(themed("backgroundColor"), themed("color"), 33%);
				text-transform: uppercase;
				font-size: 1.25em;
				padding-bottom: 0.25em;
				border-bottom: 1px solid currentColor;
			}

			> .user-wardrobe > .paint-selector > .paint-item {
				background-color: darken(themed("backgroundColor"), 4);

				&[selected="true"] {
					background-color: transparentize(themed("primary"), 0.85);

					> :nth-child(1) {
						color: themed("accent");
					}
				}
			}
			> .user-wardrobe > .badge-selector > .badge-item[selected="true"] {
				border-top: 0.25em solid lighten(themed("accent"), 16);
				border-radius: 0.75em;
			}
		}

		> h2 {
			margin: 0.5em;
		}

		> .user-settings-section,
		.user-wardrobe {
			margin-left: 1em;
			margin-right: 1em;

			> .badge-selector {
				display: flex;
				gap: 0.5em;
				flex-wrap: wrap;

				> .badge-item {
					cursor: pointer;
				}
			}

			> .paint-selector {
				display: flex;
				flex-wrap: wrap;
				gap: 0.25em;

				> .paint-item {
					display: flex;
					align-items: center;
					width: fit-content;
					padding: 0.5em;
					gap: 0.5em;
					border-radius: 0.3em;
					user-select: none;

					&:not([selected="true"]) {
						cursor: pointer;
						> :nth-child(1) {
							display: none;
						}
					}

					> span {
						display: grid;
						grid-template-columns: auto auto;
					}
				}
			}
		}
	}
}

.user-settings-actions {
	display: flex;
	width: 100%;
	height: 4em;

	> button {
		border-radius: 0;
		font-size: 1.25em;

		&:nth-child(1) {
			width: 25%;
		}
		&:nth-child(2) {
			width: 75%;
		}
	}
}
</style>
