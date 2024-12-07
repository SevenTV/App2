<template>
	<main class="admin-cosmetics">
		<div selector="heading">
			<h3>Cosmetics Manager</h3>

			<TextInput v-model="filter" label="Search..." />
			<!-- Buttons -->
			<div selector="create-buttons">
				<Button label="New Paint" appearance="raised" color="accent" @click="view = 'builder'" />
				<Button label="New Badge" appearance="raised" color="accent" />
			</div>
		</div>

		<div selector="visible-content">
			<div v-if="view === 'overview'" class="cosmetics-list">
				<!-- Display Paints -->
				<h2>Paints</h2>
				<div selector="paints-list">
					<div
						v-for="paint in filteredPaints"
						:key="paint.id"
						class="paint-wrapper"
						@click="editPaint(paint)"
					>
						<PaintComponent :paint="paint" :text="true">
							<span>{{ paint.name }}</span>
						</PaintComponent>
					</div>
				</div>

				<!-- Display Paints -->
				<div selector="badges-list"></div>
			</div>

			<div v-else-if="view === 'builder'">
				<Button
					appearance="outline"
					color="accent"
					label="Back"
					@click="[(currentPaint = null), (view = 'overview')]"
				/>
				<AdminPaintBuilder :paint="currentPaint" @exit="closeEditor" />
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GetCosmetics } from "@/apollo/query/cosmetics.query";
import { Paint } from "@/structures/Cosmetic";
import TextInput from "@/components/form/TextInput.vue";
import Button from "@/components/utility/Button.vue";
import AdminPaintBuilder from "./AdminPaintBuilder.vue";

const PaintComponent = defineAsyncComponent(() => import("@/components/utility/Paint.vue"));

const { onResult } = useQuery<GetCosmetics>(GetCosmetics);

const filter = ref("");

const paints = ref([] as Paint[]);
const filteredPaints = computed(() =>
	paints.value.filter((paint) => {
		// eslint-disable-next-line quotes
		if (filter.value.replaceAll('"', "") === paint.id) return true;
		return paint.name.toLowerCase().includes(filter.value.toLowerCase());
	}),
);

onResult(
	(res) =>
		(paints.value =
			res.data.cosmetics.paints.map((p) => {
				p.shadows = p.shadows.map((s) => {
					s.x_offset = s.x_offset.toString();
					s.y_offset = s.y_offset.toString();
					s.radius = s.radius.toString();
					return s;
				});
				return p;
			}) ?? []),
);

const view = ref<"overview" | "builder">("overview");
const currentPaint = ref(null as Paint | null);

const editPaint = (paint: Paint) => {
	currentPaint.value = paint;
	view.value = "builder";
};
const closeEditor = () => {
	currentPaint.value = null;
	view.value = "overview";
};
</script>

<style scoped lang="scss">
@import "@scss/themes.scss";

main.admin-cosmetics {
	width: 100%;

	@include themify() {
		> [selector="heading"] {
			background-color: lighten(themed("backgroundColor"), 4);
		}

		.cosmetics-list > [selector="paints-list"] > .paint-wrapper {
			background-color: lighten(themed("backgroundColor"), 4);
		}
	}

	> div[selector="heading"] {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		height: 4em;

		> h3 {
			margin: 1em;
		}

		> [selector="create-buttons"] {
			margin-right: 1em;
			> button {
				margin: 0.25em;
			}
		}
	}

	> div[selector="visible-content"] {
		margin: 1em;
	}
}

.cosmetics-list {
	display: block;
	width: 100%;

	> [selector="paints-list"] {
		display: flex;
		flex-wrap: wrap;
		flex-direction: row;

		> .paint-wrapper {
			cursor: pointer;
			border-radius: 0.3em;
			padding: 0.5em;
			margin: 0.1em;
		}
	}
}
</style>
