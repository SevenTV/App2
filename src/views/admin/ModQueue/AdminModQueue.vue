<template>
	<main ref="mainEl" class="admin-mod-queue">
		<div class="mod-queue-category-item q-floating" :disabled="query.loading.value" @click="query.refetch()">
			{{ query.loading.value ? "Loading..." : "Refetch" }}
		</div>
		<div class="mod-queue-stats">
			<p>{{ total }} pending requests</p>
			<section class="mod-queue-categories">
				<div>
					<TextInput v-model="searchQuery" icon="search" label="Search requests" width="12em" />
				</div>
				<div>
					<TextInput
						v-model="country"
						icon="search"
						label="Country"
						width="6em"
						:maxlength="2"
						:error="country !== '' && !CISO2.has(country.toUpperCase())"
					/>
				</div>
				<div ref="groupDropdown" class="mod-queue-dropdown mod-queue-category-item">
					<div class="mod-queue-category-item" :active="dropdownOpen" @click="dropdownOpen = !dropdownOpen">
						<Icon icon="language" />
						Groups
					</div>
					<div v-if="dropdownOpen" class="mod-queue-dropdown-content">
						<div class="mod-queue-dropdown-item">
							<Toggle id="filterType" v-model="filterType" left="Show" right="Hide" />
						</div>
						<div class="mod-queue-dropdown-separator" />
						<div v-for="c in GROUPS" :key="c.name" class="mod-queue-dropdown-item">
							<img :src="`https://flagcdn.com/${c.flag}.svg`" width="24" />

							<label :for="c.name">{{ c.name }}</label>
							<input
								:id="c.name"
								v-model="c.state.value"
								class="mod-queue-dropdown-checkbox"
								type="checkbox"
								:hide="filterType"
							/>
						</div>
					</div>
				</div>
				<div>
					<label for="limit">Limit: {{ _limit }}</label>
					<RangeInput v-model.number="_limit" :min="1" :max="250" width="8em" />
				</div>
			</section>
			<section class="mod-queue-categories">
				<div class="mod-queue-category-item" :disabled="query.loading.value" @click="query.refetch()">
					{{ query.loading.value ? "Loading..." : "Refetch  " }}
				</div>
				<div class="mod-queue-category-item" :active="autoSync" @click="autoSync = !autoSync">AutoSync</div>
			</section>
			<section class="mod-queue-categories">
				<div class="mod-queue-category-item" :active="bigMode" @click="bigMode = !bigMode">Zoomed</div>
			</section>
			<section class="mod-queue-categories">
				<div class="mod-queue-category-item" :active="activeTab === 'list'" @click="activeTab = 'list'">
					<Icon icon="globe" />
					Public Listing
				</div>
				<div
					class="mod-queue-category-item"
					:active="activeTab === 'personal_use'"
					@click="activeTab = 'personal_use'"
				>
					<Icon icon="user-lock" />
					Personal Use
				</div>
			</section>
		</div>
		<div>
			<div class="mod-request-card-list" :big="bigMode">
				<template v-if="false">
					<template v-for="i of 12" :key="i">
						<div class="mod-request-card-wrapper" tabindex="-1">
							<ModRequestCard :id="i" :request="fakeRequest" />
						</div>
					</template>
				</template>
				<template v-else>
					<template v-for="(r, i) of filtered" :key="r.id">
						<div
							v-if="i < visible"
							v-show="matchesSearch(r)"
							:target-id="r.target_id"
							class="mod-request-card-wrapper"
							tabindex="-1"
						>
							<ModRequestCard
								:read="readCards.has(r.id)"
								:request="r"
								:target="r.target"
								:is-big="bigMode"
								@decision="(t, undo) => onDecision(r, t, undo)"
							/>
						</div>
					</template>
					<div v-if="visible < filtered.length" class="mod-request-list-end">
						<div v-if="canViewMore" ref="end" />
					</div>
				</template>
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRaw, watch } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { debouncedRef, onClickOutside, useElementVisibility, useIntervalFn } from "@vueuse/core";
import { useActor } from "@/store/actor";
import { useDataLoaders } from "@/store/dataloader";
import { useModal } from "@/store/modal";
import { useMutationStore } from "@/store/mutation";
import { GetModRequests } from "@/apollo/query/mod-queue.query";
import { NetworkStatus } from "@apollo/client/core/networkStatus";
import { ObjectKind } from "@/structures/Common";
import { Emote } from "@/structures/Emote";
import { Message } from "@/structures/Message";
import EmoteDeleteModal from "@/views/emote/EmoteDeleteModal.vue";
import EmoteMergeModal from "@/views/emote/EmoteMergeModal.vue";
import RangeInput from "@/components/form/RangeInput.vue";
import TextInput from "@/components/form/TextInput.vue";
import Toggle from "@/components/form/Toggle.vue";
import Icon from "@/components/utility/Icon.vue";
import { CISO2, GROUPS } from "./Countries";
import ModRequestCard from "./ModRequestCard.vue";

const BASE_VISIBLE = 24;
const BASE_ADD = 24;

const _limit = ref(100);
const limit = debouncedRef(_limit, 500);

const bigMode = ref(false);

const activeTab = ref("list");

const fakeRequest = {} as Message.ModRequest;

const country = ref("");
const filter = computed(
	() =>
		new Set(
			Object.values(GROUPS)
				.filter((g) => g.state.value)
				.flatMap((g) => g.list),
		),
);
const filterType = ref(false);

const vars = computed(() => ({
	page: 0,
	limit: limit.value,
	wish: activeTab.value,
	country: CISO2.has(country.value.toUpperCase())
		? country.value
		: filter.value.size && !filterType.value
		? [...filter.value]
		: undefined,
}));

const query = useQuery<GetModRequests.Result, GetModRequests.Variables>(GetModRequests, vars, {
	fetchPolicy: "cache-and-network",
});

const visible = ref(24);
const end = ref<HTMLElement | null>(null);
const isAtEnd = useElementVisibility(end);
const canViewMore = ref(true);

watch(isAtEnd, (v) => {
	if (v) {
		addMore();
	}
});

const autoSync = ref(false);
const isSyncing = ref(false);
const autoSyncer = useIntervalFn(async () => {
	isSyncing.value = true;
	await query.refetch();
	isSyncing.value = false;
}, 10000);
autoSyncer.pause();
watch(autoSync, (v) => (v ? autoSyncer.resume() : autoSyncer.pause(), { immediate: true }));

const addMore = async () => {
	if (!canViewMore.value) return;
	canViewMore.value = false;
	const toload = filtered.value.slice(visible.value, visible.value + BASE_ADD).map((r) => r.target_id);
	visible.value += BASE_ADD;

	await loadEmotes(toload);

	nextTick(() => {
		canViewMore.value = visible.value < filtered.value.length;
	});
};

const reset = () => {
	visible.value = 0;
	canViewMore.value = true;
	addMore();
};

const dataloaders = useDataLoaders();

const total = ref(0);
const requests = ref([] as Message.ModRequest<Emote>[]);

const dropdownOpen = ref(false);
const groupDropdown = ref<HTMLElement | null>(null);
onClickOutside(groupDropdown, () => {
	dropdownOpen.value = false;
});

const filtered = computed(() => {
	return filter.value.size
		? requests.value.filter((r) => filterType.value !== filter.value.has(r.actor_country_code))
		: requests.value;
});

watch(filtered, reset);
const searchQuery = ref("");

const debouncedSearch = debouncedRef(searchQuery, 500);

const targetMap = new Map<string, Emote | undefined>();

const loadEmotes = async (ids: string[]) => {
	const toLoad = ids.filter((id) => !targetMap.has(id));
	if (!toLoad.length) return;
	toLoad.forEach((id) => targetMap.set(id, undefined));

	const emotes = await dataloaders.loadEmotes(toLoad);

	emotes.forEach((emote) => {
		targetMap.set(emote.id, emote);
		requests.value.forEach((r) => {
			if (r.target_id === emote.id) {
				r.target = emote;
				r.author = emote.owner ?? undefined;
			}
		});
	});
};

const readCards = ref(new Set<string>());
let block = false;
query.onResult(({ data, networkStatus }) => {
	if (networkStatus !== NetworkStatus.ready) return;
	if (!data) return;
	if (block) return;

	block = true;
	nextTick(() => (block = false));

	const d = structuredClone(toRaw(data)) as typeof data;
	if (!d?.modRequests?.messages) return;

	total.value = d.modRequests.total;
	const rs = d.modRequests.messages.filter(
		(r) => r.target_kind === ObjectKind.EMOTE,
	) as unknown as Message.ModRequest<Emote>[];
	if (!rs.length) return;

	rs.forEach((r) => {
		const emote = targetMap.get(r.target_id);
		if (!emote?.owner) return;

		r.target = emote;
		r.author = emote.owner!;
	});

	if (isSyncing.value) {
		const new_ids = new Set(rs.map((r) => r.id));

		requests.value.forEach((r) => {
			if (!new_ids.has(r.id)) {
				readCards.value.add(r.id);
			}
		});
	} else {
		requests.value = rs;
		visible.value = BASE_VISIBLE;
		canViewMore.value = rs.length > BASE_VISIBLE;
		loadEmotes(rs.slice(0, BASE_VISIBLE).map((r) => r.target_id));
	}
});

watch(debouncedSearch, (s) => {
	if (!s) return false;
	const ids = requests.value.map((r) => r.target_id);
	loadEmotes(ids);
});

const matchesSearch = (r: Message.ModRequest) => {
	const q = debouncedSearch.value.toLowerCase();
	if (!q) return true;

	if (r.target_kind !== ObjectKind.EMOTE) return false;

	const e = r.target as Emote;
	if (!e) return false;

	if (e.name.toLowerCase().includes(q)) return true;
	if (r.author && r.author.display_name.toLowerCase().includes(q)) return true;

	return false;
};

const actor = useActor();
const modal = useModal();

const m = useMutationStore();

// Called when a decision on a request is made
const onDecision = async (req: Message.ModRequest, t: string, isUndo?: boolean) => {
	readCards.value.delete(req.id);

	if (req.target_kind === ObjectKind.EMOTE && req.wish === "list") {
		switch (t) {
			case "approve":
				await m.editEmote(req.target_id, {
					listed: true,
				});
				break;
			case "unlist":
				await m.editEmote(req.target_id, {
					listed: false,
				});
				break;
			case "merge": {
				const [ok, targetID, reason] = await new Promise<[ok: boolean, targetID: string, reason: string]>(
					(resolve) => {
						modal.open("mod-request-merge-item", {
							component: EmoteMergeModal,
							props: {
								emote: req.target as Emote,
							},
							events: {
								merge: (targetID: string, reason: string) => resolve([true, targetID, reason]),
								close: () => resolve([false, "", ""]),
							},
						});
					},
				);
				if (!ok) return;

				const reqOK = !!(await m.mergeEmote(req.target_id, targetID, reason).catch(actor.showErrorModal));
				if (!reqOK) return;

				break;
			}
			case "delete": {
				const [ok, reason] = await new Promise<[ok: boolean, reason: string]>((resolve) => {
					modal.open("mod-request-delete-item", {
						component: EmoteDeleteModal,
						props: {
							emote: req.target as Emote,
							id: req.target_id,
						},
						events: {
							delete: (reason: string) => resolve([true, reason]),
							close: () => resolve([false, ""]),
						},
					});
				});
				if (!ok) return;

				await m
					.editEmote(
						req.target_id,
						{
							deleted: true,
						},
						reason,
					)
					.catch(actor.showErrorModal);
				break;
			}
			case "undelete":
				await m.editEmote(req.target_id, {
					deleted: false,
				});
				break;
		}
	} else if (req.target_kind === ObjectKind.EMOTE && req.wish === "personal_use") {
		switch (t) {
			case "validate":
				// todo: validate emote for personal use
				m.editEmote(req.target_id, {
					personal_use: true,
				});
				break;
			case "deny":
				m.editEmote(req.target_id, {
					personal_use: false,
				});
				break;
		}
	}

	const approved = t === "approve" || t === "validate";

	// Mark the request as read
	m.readMessage([req.id], !isUndo, approved)
		.catch(actor.showErrorModal)
		.then(() => {
			if (!isUndo) {
				readCards.value.add(req.id);
			} else {
				readCards.value.delete(req.id);
			}
		});
};
</script>
<style scoped lang="scss">
@import "@scss/themes.scss";

main.admin-mod-queue {
	width: 100%;
	height: 100%;
	max-height: 100vw;
	z-index: 1;

	@include themify() {
		.mod-queue-stats {
			background-color: opacify(themed("navBackgroundColor"), 1);
		}

		.mod-queue-category-item {
			background-color: lighten(themed("backgroundColor"), 4);

			&:hover {
				background-color: lighten(themed("backgroundColor"), 6);
			}
			&[active="true"] {
				background-color: lighten(themed("backgroundColor"), 8);
			}
		}

		.mod-queue-dropdown-content {
			background-color: lighten(themed("backgroundColor"), 4);
		}
	}

	.mod-queue-stats {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 3.5em;
		padding: 0.5em;
		top: 0;
	}

	.mod-queue-categories {
		display: flex;
		column-gap: 0.5em;
		justify-content: space-between;
		height: 100%;
	}

	.mod-queue-category-item {
		display: flex;
		align-items: center;
		padding: 0.5em;
		column-gap: 0.5em;
		cursor: pointer;
		height: 2em;

		&[disabled="true"] {
			pointer-events: none;
		}
	}

	.mod-request-card-list {
		display: grid;
		text-align: center;
		gap: 0.5em;
		padding: 1em;
		transition: opacity 200ms;

		&[big="true"] {
			font-size: 3em;
		}

		&[big="false"] {
			grid-template-columns: repeat(auto-fill, minmax(24em, 1fr));
		}

		&[card-view="true"] {
			opacity: 0.25;
		}

		.mod-request-list-end {
			min-height: 50em;
			min-width: 8em;
		}
	}

	.mod-request-focused {
		text-align: center;
	}
}

.mod-queue-dropdown {
	position: relative;

	.mod-queue-dropdown-content {
		position: absolute;
		top: 100%;
		left: 0;
		border: 1px solid black;
		border-radius: 0.5em;
		padding: 0.5em;
		z-index: 1;

		.mod-queue-dropdown-item {
			display: flex;
			gap: 0.5em;
			padding: 0.5em;

			label {
				flex-grow: 1;
			}

			.mod-queue-dropdown-checkbox {
				cursor: pointer;

				&[hide="true"] {
					accent-color: red !important;
				}
			}
		}

		.mod-queue-dropdown-separator {
			border-top: 1px solid black;
			margin: 0.5em 0;
		}
	}
}

.q-floating {
	position: fixed;
	display: flex;
	justify-content: center;
	bottom: 2em;
	right: 1em;
	background-color: white;
	border-radius: 0.5em;
	padding: 1em;
	height: 3em !important;
	width: 6em;
	cursor: pointer;

	border: 1px solid black;
}

.req-card-move,
.req-card-enter-active,
.req-card-leave-active {
	transition: all 1s ease-in-out;
}

.req-card-enter-from,
.req-card-leave-to {
	opacity: 0;
	transform: translateY(1em);
}

.req-card-leave-active {
	position: absolute;
}
</style>
