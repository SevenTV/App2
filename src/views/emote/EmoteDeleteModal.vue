<template>
	<ModalBase width="32em" height="16em" footer-height="3em" @close="emit('close')">
		<template #heading>
			<h2>{{ t("emote.delete_prompt.heading", [emote?.name ?? "*DELETED?"]) }}</h2>
		</template>

		<template #content>
			<div class="delete-explain">
				<span> {{ t("emote.delete_prompt.notice", [emote?.name ?? "*DELETED"]) }} </span>
				<TextInput
					v-model="reason"
					:autofocus="true"
					autocomplete="off"
					:label="t('emote.delete_prompt.reason')"
				/>
				<span v-if="!emote">
					This emote might be deleted already, manually check the
					<a v-if="id" :href="`/emotes/${id}`" target="_blank"> emote page </a>
					to confirm
				</span>
			</div>
		</template>

		<template #footer>
			<div class="action-buttons">
				<div
					v-wave="{ duration: 0.3 }"
					@click="[emit('modal-event', { name: 'delete', args: [reason] }), emit('close')]"
				>
					{{ t("common.delete").toUpperCase() }}
				</div>

				<div v-wave="{ duration: 0.3 }" @click="emit('close')">
					{{ t("common.cancel").toUpperCase() }}
				</div>
			</div>
		</template>
	</ModalBase>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { ModalEvent } from "@/store/modal";
import { Emote } from "@/structures/Emote";
import TextInput from "@/components/form/TextInput.vue";
import ModalBase from "@/components/modal/ModalBase.vue";

const emit = defineEmits<{
	(e: "close"): void;
	(e: "modal-event", t: ModalEvent): void;
}>();

defineProps<{
	emote?: Emote;
	id?: string;
}>();

const { t } = useI18n();

const reason = ref("");
</script>

<style scoped lang="scss">
.delete-explain {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	height: 100%;
	padding: 1em;

	> span {
		font-size: 1.25em;
		text-align: center;
	}
}

.action-buttons {
	display: flex;
	justify-content: space-between;
	height: 100%;

	> div {
		cursor: pointer;
		width: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		place-items: center;
		text-align: center;

		&:nth-child(1) {
			background-color: red;
		}
	}
}
</style>
