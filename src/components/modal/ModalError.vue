<template>
	<ModalBase width="28em" height="16em" footer-height="3em" @close="emit('close')">
		<template #heading>
			<h3>Error {{ code }}</h3>
		</template>

		<template #content>
			<div class="error-content">
				<p selector="error-name">{{ error }}</p>
				<p selector="error-detail">{{ detail }}</p>
			</div>
		</template>
	</ModalBase>
</template>

<script setup lang="ts">
import type { ModalEvent } from "@store/modal";
import { GraphQLErrors } from "@apollo/client/errors";
import ModalBase from "@/components/modal/ModalBase.vue";

const emit = defineEmits<{
	(e: "close"): void;
	(e: "modal-event", t: ModalEvent): void;
}>();

defineProps<{
	error?: string;
	detail?: string;
	code?: number;
	gql?: GraphQLErrors;
}>();
</script>

<style scoped lang="scss">
.error-content {
	padding: 1em;
	display: flex;
	flex-direction: column;
	justify-content: center;
	width: 100%;
	text-align: center;

	> [selector="error-name"] {
		color: rgb(220, 45, 45);
		font-size: 2em;
	}
	> p {
		font-size: 1.25em;
	}
}
</style>
