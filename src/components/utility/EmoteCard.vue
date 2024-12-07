<template>
	<div v-if="emote && emote.id" ref="emoteCard" class="emote-card" tabindex="-1" :style="{ filter: borderFilter }">
		<router-link
			tabindex="0"
			:to="{
				name: 'Emote',
				params: {
					emote: emote.id,
				},
			}"
			class="unstyled-link"
			:class="{ decorative }"
			@contextmenu.prevent="openContext"
		>
			<div
				class="img-wrapper"
				:censor="
					!forceUncensor && !emote.state.includes('LISTED') && !actor.hasPermission(Permissions.EditAnyEmote)
				"
			>
				<img v-if="src" :loading="lazy ? 'lazy' : undefined" :src="src" />
			</div>
			<div class="img-gap" />
			<div class="title-banner">
				<span>{{ alias || emote.name }}</span>
			</div>
			<div v-if="emote.owner" class="title-banner submitter">
				<UserTag :user="emote.owner" :hide-avatar="true" :cosmetics="true"></UserTag>
			</div>
			<div v-if="alias && emote.name !== alias" class="title-banner alias-og">
				<span>
					<span class="aka">aka</span>
					<span class="og-name"> {{ emote?.name }} </span>
				</span>
			</div>
		</router-link>

		<div class="state-indicator-list">
			<div class="state-indicator-wrapper">
				<div v-if="emoteActor" class="state-indicator actor-indicator">
					<img
						v-tooltip="t('emote_set.label_actor', [emoteActor.display_name])"
						v-tooltip:position="'right-end'"
						:src="emoteActor.avatar_url"
						class="emote-actor"
					/>
				</div>

				<TransitionGroup name="fade">
					<div v-for="ind of indicators" :key="ind.icon" class="state-indicator">
						<div
							v-if="ind.tooltip === 'Unlisted'"
							v-tooltip="ind.tooltip"
							v-tooltip:position="'right-end'"
							:style="{ cursor: 'pointer' }"
							class="state-indicator unlisted-indicator"
							@click="forceUncensor = !forceUncensor"
						>
							<div class="icon" :style="{ color: ind.color }">
								<Icon :icon="ind.icon" />
							</div>
						</div>
						<div v-else v-tooltip="ind.tooltip" v-tooltip:position="'right-end'">
							<div class="icon" :style="{ color: ind.color }">
								<Icon :icon="ind.icon" />
							</div>
						</div>
					</div>
				</TransitionGroup>
			</div>
		</div>
	</div>
	<div v-else>
		<div class="emote-card"></div>
	</div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { useModal } from "@/store/modal";
import { useMutationStore } from "@/store/mutation";
import { useActor } from "@store/actor";
import { getImage } from "@/structures/Common";
import { Emote } from "@/structures/Emote";
import { Permissions } from "@/structures/Role";
import { User } from "@/structures/User";
import { useContextMenu } from "@/composables/useContextMenu";
import EmoteCardContext from "@/components/utility/EmoteCardContext.vue";
import UserTag from "@/components/utility/UserTag.vue";
import Icon from "./Icon.vue";

const SelectEmoteSet = defineAsyncComponent(() => import("@/components/modal/SelectEmoteSet/SelectEmoteSet.vue"));

const props = withDefaults(
	defineProps<{
		emote: Emote;
		emoteActor?: User;
		origin?: string | null;
		scale?: string;
		alias?: string;
		unload?: boolean;
		personalContext?: boolean;
		decorative?: boolean;
		hideIndicators?: boolean;
		lazy?: boolean;
		size?: 1 | 2 | 3 | 4;
	}>(),
	{
		emote: () => ({ id: "" } as Emote),
		scale: "10em",
		lazy: false,
		size: 2,
	},
);

const { t } = useI18n();

const borderFilter = ref("");

const { namedSets } = storeToRefs(useStore());
const actor = useActor();

const isUnavailable = ref(false);
const forceUncensor = ref(false);

const modal = useModal();
const m = useMutationStore();

const emoteCard = ref<HTMLDivElement>();
const indicators = ref<Indicator[]>([]);

const src = ref("");

const { open: openContextMenu } = useContextMenu();
function openContext(ev: MouseEvent) {
	openContextMenu(ev, EmoteCardContext, { emote: props.emote }).then((v) => {
		switch (v) {
			case "use-add": {
				const set = actor.defaultEmoteSet;
				if (!set || !actor.defaultEmoteSetID) {
					break;
				}

				m.setEmoteInSet(actor.defaultEmoteSetID, "ADD", props.emote.id).catch(actor.showErrorModal);
				break;
			}
			case "use-del": {
				const set = actor.defaultEmoteSet;
				if (!set || !actor.defaultEmoteSetID) {
					break;
				}

				m.setEmoteInSet(actor.defaultEmoteSetID, "REMOVE", props.emote.id).catch(actor.showErrorModal);

				break;
			}
			case "use-select":
				modal.open("emote-set-select-at-card", {
					component: SelectEmoteSet,
					events: {
						change: (action, id, cb, name?) => {
							m.setEmoteInSet(id, action, props.emote.id, name).then(cb).catch(actor.showErrorModal);
						},
					},
					props: { emote: props.emote },
				});
				break;
			case "open-in-new-tab":
				window.open(`/emotes/${props.emote.id}`, "_blank");
				break;
			case "copy-emote-link":
				navigator.clipboard.writeText(`${window.location.origin}/emotes/${props.emote.id}`);
				break;
			default:
				break;
		}
	});
}

watchEffect(() => {
	if (!props.emote || !props.emote.id) return;

	let list = [] as Indicator[];

	src.value = getImage(props.emote.host, actor.preferredFormat, props.size)?.url ?? "";
	isUnavailable.value = typeof props.emote.lifecycle === "number" && props.emote.lifecycle !== Emote.Lifecycle.LIVE;

	if (props.hideIndicators) return;

	const ae = actor.activeEmotes.get(props.emote.id as string);
	if (ae) {
		const isForeign = ae.origin_id;
		const setName = actor.defaultEmoteSet?.name ?? "";

		list.push({
			icon: "check",
			tooltip: isForeign
				? t("emote.card_label_added_foreign", [setName])
				: t("emote.card_label_added", [setName]),
			color: isForeign ? "#4d66b3" : "#9146ff",
		});
	}
	if (props.emote.state.includes("LISTED") === false) {
		list.push({
			icon: "eye-slash",
			tooltip: "Unlisted",
			color: "#eb3d26",
		});
	}
	if (Emote.IsZeroWidth(props.emote)) {
		list.push({
			icon: "object-group",
			tooltip: "Zero-Width Emote",
			color: "goldenrod",
		});
	}
	if (Emote.IsPrivate(props.emote)) {
		list.push({
			icon: "lock",
			tooltip: "Private Emote",
			color: "#878787",
		});
	}
	if (props.alias && props.alias !== props.emote.name) {
		list.push({
			icon: "tag",
			tooltip: "Renamed In Set",
			color: "aquamarine",
		});
	}
	if (props.emote.trending) {
		list.push({
			icon: "fire",
			tooltip: t("emote.trending_rank", [props.emote.trending]),
			color: "#ff9632",
		});
	}
	if (props.origin) {
		list.push({
			icon: "sync",
			tooltip: t("emote_set.label_synced", [props.origin]),
			color: "#4d66b3",
		});
	}
	// if emote is in global set
	if (namedSets.value.global[1][props.emote.id]) {
		list.push({
			icon: "star",
			tooltip: "Global Emote",
			color: "#16cc2c",
		});
	}

	if (isUnavailable.value) {
		list = [
			{
				icon: "trash",
				tooltip: "No Longer Available",
				color: "darkred",
			},
		];
	}

	if (props.personalContext) {
		if (props.emote.state.includes("NO_PERSONAL")) {
			list = [
				{
					icon: "user-slash",
					tooltip: t("emote_set.personal.not_allowed"),
					color: "salmon",
				},
			];
		} else if (!props.emote.state.includes("PERSONAL")) {
			list.push({
				icon: "user-clock",
				tooltip: t("emote_set.personal.pending_review"),
				color: "#948476",
			});
		}
	}

	indicators.value = list;
	borderFilter.value = list.map(({ color }) => `drop-shadow(0.03em 0.03em 0.075em ${color})`).join(" ");
});

interface Indicator {
	icon: string;
	tooltip: string;
	color: string;
}
</script>

<style lang="scss" scoped>
@import "@scss/themes.scss";

.emote-card > a {
	display: flex;
	width: v-bind(scale);
	height: v-bind(scale);
	cursor: pointer;
	border: solid 0.1em;
	border-color: transparent;
	border-radius: 0.1em;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	-webkit-user-drag: none;
	user-select: none;

	@include themify() {
		background-color: darken(themed("backgroundColor"), 2);
	}

	&:hover {
		border: 1px solid white;
	}

	// text values in the card
	.title-banner {
		height: 1em;
		max-width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;

		> span {
			font-family: Ubuntu, sans-serif;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			margin-left: 0.3em;
			margin-right: 0.3em;
		}

		&.alias-og {
			color: gray;
			font-size: 0.65em;
			margin-top: 0.1em;
			span.aka {
				margin-right: 0.3em;
			}
			span.og-name {
				font-weight: 600;
			}
		}
		&.submitter {
			margin-top: 0.25em;
			font-size: 0.75em;
			width: 80%;
			border-bottom-left-radius: 8px;
			border-bottom-right-radius: 8px;
		}
	}

	// Spacing between the image and other content
	.img-gap {
		height: 1em;
	}

	.img-wrapper {
		display: flex;
		justify-content: center;
		height: 50%;

		&[censor="true"] {
			filter: blur(0.5em);
			image-rendering: pixelated;
		}

		.is-processing {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-self: flex-end;
			align-items: center;

			span {
				margin-top: 1em;
			}
		}
		img {
			margin-top: 1em;
			min-width: 5em;
			max-width: 55%;
			object-fit: contain;
			pointer-events: none;
		}
	}

	&.decorative {
		pointer-events: none;
	}
}

.state-indicator-list {
	position: absolute;

	.state-indicator-wrapper {
		position: relative;
		bottom: calc(v-bind(scale) - 0.25em);
		left: -0.5em;
		display: flex;
		flex-direction: column;
	}

	.emote-actor {
		border-radius: 50%;

		width: 1.1rem;
	}
}
</style>
