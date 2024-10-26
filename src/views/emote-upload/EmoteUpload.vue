<template>
	<div class="emote-upload">
		<!-- Heading -->
		<div class="heading">
			<h2>{{ t("emote.upload.submit_emote") }}</h2>
		</div>

		<!-- Content -->
		<div class="content">
			<div class="overall-form">
				<!-- Information Inputs -->
				<div class="inputs form-grid-item">
					<h3>{{ t("emote.upload.emote_details") }}</h3>

					<form>
						<TextInput v-model="form.name" class="form-item" :label="t('emote.upload.emote_name')" />

						<Checkbox :checked="form.zero_width" label="Zero-Width" class="form-item" />
						<Checkbox :checked="form.private" label="Private" class="form-item" />

						<h4>{{ t("emote.tags") }}</h4>
						<EmoteTagList :editable="true" :limit="6" @update="(tags) => (form.tags = tags)" />
					</form>
				</div>

				<!-- Image Upload -->
				<div class="image-upload form-grid-item">
					<div
						:dragOver="dragOver"
						@drop.prevent="onDropFile"
						@dragover.prevent
						@dragenter="dragOver = true"
						@dragleave="dragOver = false"
					>
						<h3>{{ t("emote.upload.image_upload") }}</h3>
						<a class="acceptable-format-list" @click="formatsViewerOpen = !formatsViewerOpen">
							{{ t("emote.upload.accepted_formats") }}
							<Icon v-if="formatsViewerOpen" icon="close" />
						</a>

						<!-- Formats Viewer -->
						<div v-if="formatsViewerOpen" ref="formatsViewer" class="formats-viewer">
							<div class="format" categories>
								<div part="label">{{ t("emote.upload.filetype") }}</div>
								<div part="animation">{{ t("emote.upload.animation") }}</div>
								<div part="transparency">{{ t("emote.upload.transparency") }}</div>

								<span part="close-btn" @click="formatsViewerOpen = false">
									<Icon icon="close" />
								</span>
							</div>
							<div v-for="f of acceptableFileTypes" :key="f.label" class="format" :format="f.mime">
								<div part="label">{{ f.label }}</div>
								<div part="animation">
									<Icon v-if="f.animation" icon="check" color="lime" />
									<Icon v-else icon="times" color="red" />
								</div>
								<div part="transparency">
									<Icon v-if="f.transparency == 'full'" icon="check" color="lime" />
									<Icon
										v-else-if="f.transparency == 'half'"
										v-tooltip="t('emote.upload.half_transparency_tooltip')"
										v-tooltip:position="'top-end'"
										icon="minus"
										color="orange"
									/>
									<Icon v-else icon="times" color="red" />
								</div>
							</div>
						</div>
						<input id="file-upload" hidden type="file" :accept="mimeList" @change="onFileInputChange" />
						<label for="file-upload">
							<img ref="previewImage" />
						</label>

						<div class="requirements">
							<strong>Limits</strong>
							<p>File size: 7MB</p>
							<p>Image dimensions: 1000x1000</p>
							<p>Image frames: 1000</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Upload Button -->
			<div class="queue-priority">
				<span>Your emote will be unlisted until review by a moderator.</span>
				<router-link class="subscribe-cta" :to="{ name: 'Store' }">
					<Icon icon="star" />
					{{
						hasUploadPriority
							? "You have priority in queue as a subscriber"
							: "Subscribe for priority queue!"
					}}
					<Icon icon="star" />
				</router-link>
			</div>
			<span v-if="uploadError" class="upload-error">Error: {{ uploadError }}</span>
			<div class="actions">
				<div class="progress" :style="{ width: !uploadProgress ? 'inherit' : `${uploadProgress.toFixed(5)}%` }">
					<span :style="{ justifyContent: !uploadProgress ? 'center' : 'flex-end' }">
						<span v-if="uploadProgress > 0" class="progress-counter">{{ uploadProgress.toFixed(1) }}%</span>
						<span
							v-else
							class="submit-button"
							:class="{ 'missing-file': !buf?.byteLength || uploadError }"
							@click="upload"
						>
							{{ t("common.submit").toUpperCase() }}
						</span>
					</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { onClickOutside } from "@vueuse/core";
import { useActor } from "@/store/actor";
import { Emote } from "@/structures/Emote";
import { Permissions } from "@/structures/Role";
import Checkbox from "@/components/form/Checkbox.vue";
import TextInput from "@/components/form/TextInput.vue";
import Icon from "@/components/utility/Icon.vue";
import { useStore } from "../../store/main";

const EmoteTagList = defineAsyncComponent(() => import("@/views/emote-upload/EmoteTagList.vue"));

const { t } = useI18n();

const actor = useActor();
const hasUploadPriority = computed(() => actor.hasPermission(Permissions.PriorityMessaging));

// File Formats
const acceptableFileTypes = [
	{ mime: "image/avif", label: "AVIF", transparency: "full", animation: true },
	{ mime: "image/webp", label: "WEBP", transparency: "full", animation: true },
	{ mime: "image/gif", label: "GIF", transparency: "half", animation: true },
	{ mime: "image/png,image/apng", label: "PNG", transparency: "full", animation: true },
	{ mime: "image/tiff", label: "TIFF", transparency: "full" },
	{ mime: "image/jpeg", label: "JPEG" },
	{ mime: "video/webm", label: "WEBM", animation: true },
	{ mime: "video/mp4", label: "MP4", animation: true },
	{ mime: "video/x-flv", label: "FLV", animation: true },
	{ mime: "video/avi,video/x-msvideo", label: "AVI", animation: true },
	{ mime: "video/quicktime", label: "MOV", animation: true },
] as FileType[];
const mimeList = acceptableFileTypes.map((ft) => ft.mime).join(",");

// Gather versioning info
const router = useRouter();

// Formats viewer
const formatsViewerOpen = ref(false);
const formatsViewer = ref<HTMLElement | null>(null);

onMounted(() => {
	onClickOutside(formatsViewer, () => (formatsViewerOpen.value = false));
});

// Form
const form = reactive({
	name: "",
	version_description: "",
	zero_width: false,
	private: false,
	tags: [] as string[],
	isCreator: false,

	credits: {
		original_creator: "",
	},
});

// Input File
const previewImage = ref<HTMLImageElement | null>(null);
const buf = ref<ArrayBuffer | null>(null);
let mime = "";
const onFileInputChange = (event: Event) => {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0] as File;
	handleFile(file);
};
const dragOver = ref(false);
const onDropFile = (event: DragEvent) => {
	dragOver.value = false;
	const file = event.dataTransfer?.files[0] as File;
	if (!file) {
		throw new Error("No file provided during drop event");
	}
	handleFile(file);
};
const handleFile = async (file: File) => {
	uploadError.value = "";

	const url = URL.createObjectURL(file);
	if (previewImage.value) {
		previewImage.value.src = url;
		previewImage.value.onload = () => {
			URL.revokeObjectURL(url);
			if (!previewImage.value) return;

			const w = previewImage.value.naturalWidth;
			const h = previewImage.value.naturalHeight;

			if (w > 1000 || h > 1000) {
				uploadError.value = "Image is too large (must be less than 1000x1000)";
			}

			const aspectRatio = w / h;
			if (aspectRatio > 3.0) {
				uploadError.value = "Image aspect ratio is too large (must be less than 3:1)";
			} else if (aspectRatio < 1 / 32) {
				uploadError.value = "Image aspect ratio is too small (must be more than 1:32)";
			}
		};
	}

	if (file.size >= 7e6) {
		uploadError.value = "File is larger than 7MB";
	}

	mime = file.type;
	buf.value = await file.arrayBuffer();
	if (!form.name) {
		form.name = file.name.slice(0, file.name.lastIndexOf("."));
	}
};

// Upload (network request)
const uploadProgress = ref(0);
const uploadError = ref("");
const store = useStore();

const upload = () => {
	uploadError.value = "";
	const data = {
		name: form.name,
		flags: (form.zero_width ? Emote.Flags.ZERO_WIDTH : 0) | (form.private ? Emote.Flags.PRIVATE : 0),
		tags: form.tags,
	} as Record<string, unknown>;

	if (!buf.value) {
		uploadError.value = "Missing file";
		return;
	}

	const req = new XMLHttpRequest();
	req.open("POST", `${import.meta.env.VITE_APP_API_REST as string}/emotes`, true);
	req.setRequestHeader("X-Emote-Data", JSON.stringify(data));
	req.setRequestHeader("Content-Type", mime);
	req.setRequestHeader("Content-Length", buf.value.byteLength.toString(10));
	if (store.authToken) {
		req.setRequestHeader("Authorization", `Bearer ${store.authToken}`);
	}
	req.withCredentials = true;
	req.upload.onprogress = (progress) => (uploadProgress.value = (progress.loaded / progress.total) * 100);
	req.onload = () => {
		uploadProgress.value = 0;
		if (req.status !== 201) {
			const { error } = JSON.parse(req.responseText);
			uploadError.value = `${error} (${req.status} ${req.statusText})`;
		}
		// upload is complete, redirect to the emote's page
		const { id } = JSON.parse(req.responseText);
		if (typeof id === "string" && id.length > 0) {
			router.push(`/emotes/${id}`);
		}
	};

	req.send(buf.value);
};

// const emoteRegexp = /^[-_A-Za-z():0-9]{100}$/;

interface FileType {
	mime: string;
	label: string;
	animation?: boolean;
	transparency?: "full" | "half" | false;
}
</script>

<style lang="scss" scoped>
@import "@scss/emote-upload/emote-upload.scss";
@import "@scss/themes.scss";

.queue-priority {
	display: flex;
	flex-direction: column;
	justify-content: center;
	text-align: center;
	margin: 1rem 10%;

	.subscribe-cta {
		color: $subColor;
		margin-left: 0.25rem;
		font-weight: bolder;
	}
}

.requirements {
	margin: 1rem 0;
	text-align: center;
}
</style>
