<template>
	<div class="user-card-popper">
		<UserCard v-if="cardVisible" :user="user" @close="cardVisible = false"></UserCard>
	</div>

	<a
		v-if="user"
		ref="userTag"
		class="user-tag unstyled-link"
		:clickable="clickable"
		:href="clickable && user.id ? `/users/${user.id}` : undefined"
		@click.right="toggleCard"
		@click="toggleCard"
	>
		<!-- Profile Picture -->
		<span v-if="!hideAvatar" class="user-picture-wrapper">
			<img :src="user.avatar_url" :style="{ height: scale, width: scale }" />
		</span>

		<template v-if="user && paint">
			<Paint v-tooltip="'Paint: ' + paint.name" v-tooltip:position="'bottom'" :paint="paint" :text="true">
				<span class="username" :style="{ color: ConvertDecimalToHex(user.style.color, false) }">
					{{ user.display_name ?? user.username }}
				</span>
			</Paint>
		</template>
		<template v-else>
			<span class="username" :loading="!user?.id">
				{{ user.display_name ?? user.username }}
			</span>
		</template>
	</a>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { useDataLoaders } from "@/store/dataloader";
import { Paint as PaintType } from "@/structures/Cosmetic";
import type { User } from "@/structures/User";
import { ConvertDecimalRGBAToString, ConvertDecimalToHex } from "@/structures/util/Color";
import Paint from "./Paint.vue";

const UserCard = defineAsyncComponent(() => import("@/components/utility/UserCard.vue"));

const props = defineProps<{
	user: User;
	scale?: string;
	textScale?: string;
	hideAvatar?: boolean;
	clickable?: boolean;
	cosmetics?: boolean;
}>();

const paint = ref(null as PaintType | null);

const { loadCosmetics } = useDataLoaders();
const renderCosmetics = () => {
	paint.value = null;

	if (!(props.cosmetics && props.user && props.user.id)) return;

	if (props.user.style?.paint_id) {
		loadCosmetics(props.user.style.paint_id).then((cos) => (paint.value = cos[0] as PaintType));
	}
};

watch(props, renderCosmetics, { immediate: true });

const userTag = ref<HTMLElement | null>(null);

const tagColor = computed(() =>
	((props.user && props.user.style?.color) ?? 0) !== 0
		? ConvertDecimalRGBAToString(props.user?.style.color ?? 0)
		: "currentColor",
);

const cardVisible = ref(false);
const toggleCard = (ev: MouseEvent) => {
	if (!props.clickable) {
		return;
	}
	ev.preventDefault();
	cardVisible.value = !cardVisible.value;
};
</script>

<style lang="scss" scoped>
.user-tag {
	display: inline-block;
	vertical-align: middle;

	cursor: inherit;
	&[clickable="true"] {
		cursor: pointer;
	}

	.user-picture-wrapper > img {
		vertical-align: middle;
		border-radius: v-bind(scale);
		box-sizing: border-box;
		border: 0.01em solid v-bind(tagColor);
		clip-path: circle(99% at 50% 50%);
		height: v-bind(scale);
		width: v-bind(scale);
		margin-right: calc(v-bind(scale) * 0.15);
		text-indent: calc(v-bind(scale) * 2);

		&[suspense="true"] {
			border: 0.25em solid currentColor;
			opacity: 0.05;
		}
	}

	[loading="true"] {
		&.avatar {
			border-style: none;
		}
		&.username {
			min-width: 6em;
			height: 1em;
		}
	}

	.username {
		display: inline-block;
		vertical-align: middle;
		font-size: v-bind(textScale);
		color: v-bind(tagColor);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
.user-card-popper {
	position: absolute;
	z-index: 100;
}
</style>
