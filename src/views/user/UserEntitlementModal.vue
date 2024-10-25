<template>
	<ModalBase width="32em" min-height="16em" @close="onClose">
		<template #heading>
			<h2>Assign entitlement</h2>
		</template>

		<template #content>
			<div class="content">
				<div class="left">
					<div class="options">
						<Toggle
							id="filterType"
							v-model="paintMode"
							left="Badge"
							right="Paint"
							@click="objectRef = ''"
						/>
						<Checkbox v-model="subOnly" :checked="subOnly" label="Subscriber" />
						<TextInput v-model="reason" label="Reason" />
					</div>
					<div class="preview">
						<div v-if="!objectRef">
							<h3>None selected</h3>
						</div>
						<template v-else>
							<div v-if="kind == 'BADGE'" class="selection-item">
								<BadgeC v-bind="selected as BadgeDef" class="badge" />
								<span>
									{{ selected!.name }}
								</span>
							</div>
							<div v-else-if="kind == 'PAINT'" class="selection-item">
								<Suspense>
									<PaintComponent :paint="selected as Paint" size="2rem" :text="true">
										<span>{{ selected!.name }}</span>
									</PaintComponent>
								</Suspense>
							</div>
						</template>
					</div>
				</div>
				<div class="right">
					<TextInput v-model="filter" icon="search" label="Filter" />
					<div class="selection">
						<template v-if="kind == 'BADGE'">
							<div
								v-for="badge in assignable.badges"
								:key="badge.id"
								class="selection-item"
								@click="objectRef = badge.refID!"
							>
								<BadgeC v-bind="badge" class="badge" />
								<span>
									{{ badge.name }}
								</span>
							</div>
						</template>
						<template v-else>
							<div
								v-for="paint in assignable.paints"
								:key="paint.id"
								class="selection-item"
								@click="objectRef = paint.id"
							>
								<PaintComponent :paint="paint" size="2rem" :text="true">
									<span>{{ paint.name }}</span>
								</PaintComponent>
							</div>
						</template>
					</div>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="actions">
				<div action="confirm" :disabled="!reason.length" @click="assignEntitlement">ASSIGN</div>
				<div action="cancel" @click="onClose">CANCEL</div>
			</div>
		</template>
	</ModalBase>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
import { ModalEvent } from "@/store/modal";
import type { Badge, Paint } from "@/structures/Cosmetic";
import BadgeC from "@/components/base/Badge.vue";
import Checkbox from "@/components/form/Checkbox.vue";
import TextInput from "@/components/form/TextInput.vue";
import Toggle from "@/components/form/Toggle.vue";
import ModalBase from "@/components/modal/ModalBase.vue";
import { BadgeDef, getBadgeByID } from "@/components/utility/BadgeDefs";
import { useStore } from "../../store/main";

const PaintComponent = defineAsyncComponent(() => import("@/components/utility/Paint.vue"));

const props = defineProps<{
	userId: string;
	cosmetics: { badges: Badge[]; paints: Paint[] };
	owned: { badges: BadgeDef[]; paints: Paint[] };
}>();

const emit = defineEmits<{
	(e: "close"): void;
	(e: "modal-event", t: ModalEvent): void;
}>();

const filter = ref<string>("");

const reason = ref<string>("");
const subOnly = ref<boolean>(true);
const paintMode = ref(false);
const kind = computed<"BADGE" | "PAINT">(() => (paintMode.value ? "PAINT" : "BADGE"));

const objectRef = ref<string>("");

const assignable = computed<{ badges: BadgeDef[]; paints: Paint[] }>(() => {
	return {
		badges: [
			...new Map(
				(props.cosmetics.badges ?? [])
					?.filter((b) => !props.owned.badges.some((b2) => b.tag === b2.id))
					.map((badge) => getBadgeByID(badge.tag, badge.id, badge))
					.filter((x) => x?.refID)
					.filter((x) => !x?.name || x?.name.toLowerCase().includes(filter.value.toLowerCase()))
					.map((b) => [b!.id, b!]),
			).values(),
		],

		paints:
			props.cosmetics.paints
				?.filter((p) => !props.owned.paints.some((p2) => p.id === p2.id))
				.filter((x) => x.name.toLowerCase().includes(filter.value.toLowerCase())) ?? [],
	};
});

const selected = computed(() => {
	if (!objectRef.value) return;
	if (kind.value === "BADGE") {
		return assignable.value.badges.find((b) => b.refID === objectRef.value)!;
	} else {
		return assignable.value.paints.find((p) => p.id === objectRef.value)!;
	}
});

const assignEntitlement = () => {
	const body = {
		kind: kind.value,
		object_ref: objectRef.value,
		user_id: props.userId,
		app_name: "manual",
		app_state: {
			reason: reason.value,
		},
		condition: subOnly.value ? { all_roles: ["6076a86b09a4c63a38ebe801"] } : undefined,
	};

	const store = useStore();

	fetch(import.meta.env.VITE_APP_API_REST + "/entitlements", {
		method: "POST",
		credentials: "include",
		headers: (() => {
			const headers: HeadersInit = {
				"Content-Type": "application/json",
			};

			if (store.authToken) {
				headers["Authorization"] = `Bearer ${store.authToken}`;
			}

			return headers;
		})(),
		body: JSON.stringify(body),
	}).then(onClose);
};

const onClose = () => {
	emit("modal-event", {
		name: "close",
		args: [],
	});

	emit("close");
};
</script>

<style scoped lang="scss">
@import "@scss/themes.scss";

.content {
	display: flex;
	justify-content: space-between;
	padding: 1em;
	gap: 1em;
	width: 100%;

	> div {
		flex-grow: 1;
	}

	.selection {
		overflow-y: auto;
		overflow-x: clip;
		height: 16em;
		flex-grow: 1;
		text-overflow: ellipsis;
		white-space: nowrap;
		gap: 0.5em;
		border-radius: 0.5em;
		margin-top: 1em;
	}
	.selection-item {
		width: 100%;
		align-items: center;
		padding: 0.25em;
		cursor: pointer;
		border-radius: 0.25em;
		display: flex;
		gap: 0.5em;

		.badge {
			font-size: 1.5em;
		}
		@include themify() {
			&:hover {
				background-color: lighten(themed("backgroundColor"), 8);
			}
		}
	}

	.left {
		.options {
			display: flex;
			flex-direction: column;
			justify-content: center;
			gap: 1em;
		}

		.preview {
			display: flex;
			justify-content: center;
			border-top: 0.1em solid;
			margin-top: 1em;
			padding-top: 1em;
		}
	}
}

.actions {
	display: flex;
	height: 3em;
	cursor: pointer;

	> [action] {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 50%;
	}

	@include themify() {
		> [action="confirm"] {
			background-color: themed("accent");
		}
		> [action="cancel"] {
			background-color: themed("warning");
		}
		> [disabled="true"] {
			background-color: themed("secondaryBackgroundColor");
			pointer-events: none;
		}

		.selection-item {
			cursor: pointer;
			border-radius: 0.25em;
			width: 100%;
			padding: 0.25em;
		}
	}
}
</style>
