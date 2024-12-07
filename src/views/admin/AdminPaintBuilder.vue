<template>
	<h1>Paint Builder</h1>
	<div class="paint-builder--form">
		<!-- Paint Name -->
		<TextInput v-model="data.name" width="12em" label="Paint Name" validation="required" />

		<!-- Preview -->
		<div class="paint-builder--paints-list">
			<div class="paint-builder--preview">
				<h1 :style="{ backgroundImage: bgImage, filter }" class="paint-base as-text">{{ data.name }}</h1>
			</div>
			<div class="paint-builder--preview">
				<h2 :style="{ backgroundImage: bgImage, filter }" class="paint-base as-text">
					{{ actor?.display_name }}
				</h2>
			</div>
			<div class="paint-builder--preview">
				<h3 :style="{ backgroundImage: bgImage, filter }" class="paint-base as-text">
					{{ actor?.display_name }}
				</h3>
			</div>
			<div class="paint-builder--preview">
				<p :style="{ backgroundImage: bgImage, filter }" class="paint-base as-text">
					{{ actor?.display_name }}
				</p>
			</div>
			<div class="paint-builder--preview">
				<div :style="{ backgroundImage: bgImage, filter }" class="full-paint-preview"></div>
			</div>
		</div>

		<!-- Function -->
		<div v-if="functions">
			<Dropdown
				v-model="data.function"
				:options="Object.keys(functions).map((k) => ({ id: k, name: functions[k as keyof typeof functions] as string }))"
			/>
			<span v-if="data.function === 'URL'"
				>Please be patient after adding the paint. The image will take some time to process and won't show up
				immediately.</span
			>
		</div>

		<div class="paint-builder--divider" />

		<!-- Repeat? -->
		<Checkbox v-if="data.function !== 'URL'" v-model="data.repeat" type="checkbox" label="Repeating Gradient" />

		<div class="paint-builder--divider" />

		<!-- Angle -->
		<p>Angle - {{ data.angle }}</p>
		<RangeInput
			v-if="data.function === 'LINEAR_GRADIENT'"
			v-model="data.angle"
			type="range"
			label="Angle"
			:min="0"
			:max="360"
			:help="`${data.angle}°`"
		/>

		<div class="paint-builder--divider" />

		<!-- Shape -->
		<Dropdown
			v-if="data.function === 'RADIAL_GRADIENT'"
			v-model="data.shape"
			type="select"
			:options="Object.keys(shape).map((k) => ({ id: k, name: shape[k as keyof typeof shape] as string }))"
			:style="{ color: '#327fa8' }"
			label="Shape"
		/>

		<!-- Stops (if using gradient function) -->
		<div v-if="data.function !== 'URL'" class="paint-builder--stops">
			<div v-for="(s, i) of data.stops" :key="i">
				<p class="paint-builder--stop-heading">
					<Icon icon="close" @click="removeStop(i)" />
					Stop #{{ i + 1 }}
				</p>
				<div class="paint-builder--stop-item">
					<div>
						<span>
							<label> {{ (s.at * 100).toFixed(0) }} </label>
							<RangeInput
								v-model="s.at"
								:min="0"
								:max="1"
								:step="0.01"
								@input="(v: string) => editStop(i, '', v)"
							/>
						</span>
						<ColorInput
							type="color"
							label="Color"
							:value="ConvertDecimalToHex(data.stops[i].color)"
							@input="(v) => editStop(i, v, '')"
						/>
					</div>
					<div>
						<span>
							<label>
								{{ `Opacity - ${((GetDecimalAlpha(s.color) / 255) * 100).toFixed(2) ?? "1"}%` }}
							</label>
							<RangeInput
								:value="GetDecimalAlpha(data.stops[i].color) / 255 || 1"
								:min="0"
								:max="1"
								:step="0.01"
								@input="(v) => editStop(i, '', '', parseFloat(v))"
							/>
						</span>
					</div>
				</div>
			</div>
		</div>

		<div class="paint-builder--divider" />

		<Button
			v-if="data.function !== 'URL'"
			color="primary"
			label="Add Stop"
			:style="{ width: 'fit-content' }"
			@click="addStop"
		/>

		<!-- Image URl (if using url function) -->
		<TextInput
			v-if="data.function === 'URL'"
			v-model="data.image_url"
			type="url"
			label="Image URL"
			placeholder="https://cdn.7tv.app/..."
		/>

		<!-- Drop Shadows -->
		<div class="paint-builder--shadows">
			<div v-for="(s, i) of data.shadows" :key="i" class="paint-builder--shadow-form">
				<p>
					<Icon icon="trash" @click="removeShadow(i)" />
					Shadow #{{ i + 1 }}
				</p>

				<div selector="shadow-form-area">
					<ColorInput
						type="color"
						height="100%"
						:value="ConvertDecimalToHex(s.color)"
						@input="(v) => editShadow(i, v)"
					/>
					<div class="paint-builder--shadow-inputs">
						<TextInput v-model="s.x_offset" width="6em" type="number" label="X Offset" />
						<TextInput v-model="s.y_offset" width="6em" type="number" label="Y Offset" />
						<TextInput v-model="s.radius" width="6em" type="number" label="Radius" />
					</div>
				</div>
			</div>
		</div>
		<Button color="primary" label="Add Shadow" :style="{ width: 'fit-content' }" @click="addShadow" />
		<div class="paint-builder--divider" />
	</div>

	<div class="paint-builder--data">
		<div class="buttons">
			<Button color="primary" label="Import from clipboard" @click="() => importData()" />
			<Button color="primary" label="Export for extension" @click="copyForExtension" />
		</div>
		<span v-if="importError">{{ importError }}</span>
		<code>{{ data }}</code>
	</div>

	<div class="paint-builder--divider" />

	<Button v-if="!editMode" color="accent" label="Create Paint" :disabled="create.loading.value" @click="doCreate" />
	<Button v-else color="accent" label="Update Paint" :disabled="update.loading.value" @click="doUpdate" />
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRaw } from "vue";
import { useMutation } from "@vue/apollo-composable";
import { useActor } from "@/store/actor";
import { CreatePaint, UpdatePaint } from "@/apollo/mutation/cosmetic.mutation";
import type { Paint } from "@/structures/Cosmetic";
import {
	ConvertDecimalRGBAToString,
	ConvertDecimalToHex,
	ConvertHexToRGB,
	ConvertIntColorToHex,
	ConvertRGBAToDecimal,
	GetDecimalAlpha,
} from "@/structures/util/Color";
import Checkbox from "@/components/form/Checkbox.vue";
import ColorInput from "@/components/form/ColorInput.vue";
import Dropdown from "@/components/form/Dropdown.vue";
import RangeInput from "@/components/form/RangeInput.vue";
import TextInput from "@/components/form/TextInput.vue";
import Button from "@/components/utility/Button.vue";
import Icon from "@/components/utility/Icon.vue";

const emit = defineEmits<(e: "exit") => void>();

const props = defineProps<{
	paint?: Paint | null;
}>();

const { user: actor } = useActor();
const actorColor = computed(() => ConvertIntColorToHex(actor?.style.color ?? 0));

const editMode = !!props.paint;

const data = reactive<Paint>(
	props.paint ??
		({
			name: "Unnamed Paint",
			function: "LINEAR_GRADIENT",
			repeat: false,
			angle: 90,
			shape: "circle",
			image_url: "",
			stops: [] as Paint.Stop[],
			shadows: [] as Paint.Shadow[],
		} as Paint),
);

const copyForExtension = () => {
	const extensionData = {
		id: data.id,
		kind: "PAINT",
		provider: "7TV",
		data: data,
	};

	navigator.clipboard.writeText(JSON.stringify(extensionData));
};

const functions = {
	LINEAR_GRADIENT: "Linear Gradient",
	RADIAL_GRADIENT: "Radial Gradient",
	URL: "URL",
};

const shape = {
	circle: "Circle",
	ellipse: "Ellipse",
};

const addStop = () => {
	data.stops.push({
		at: data.stops.length > 0 ? data.stops[data.stops.length - 1].at : 0,
		color: data.stops[data.stops.length - 1]?.color ?? 255,
	});
};
const editStop = (ind: number, hex: string, pos: string, alpha?: number) => {
	if (hex) {
		const rgb = ConvertHexToRGB(hex);
		const n = ConvertRGBAToDecimal(...rgb, 255);
		data.stops[ind].color = n;
	}
	if (pos) {
		data.stops[ind].at = parseFloat(pos);
	}
	if (typeof alpha !== "undefined") {
		const col = data.stops[ind].color;
		const a = alpha * 255;
		data.stops[ind].color = ((col >> 8) << 8) | a;
	}
};
const removeStop = (ind: number) => {
	data.stops.splice(ind, 1);
};

const addShadow = () => {
	const prev = data.shadows[data.shadows.length - 1];
	data.shadows.push({
		color: prev?.color ?? 255,
		radius: prev?.radius.toString() ?? "1",
		x_offset: prev?.x_offset.toString() ?? "0",
		y_offset: prev?.y_offset.toString() ?? "0",
	});
};
const editShadow = (ind: number, color: string) => {
	if (color) {
		data.shadows[ind].color = ConvertRGBAToDecimal(...ConvertHexToRGB(color), 255);
	}
};
const removeShadow = (ind: number) => {
	data.shadows.splice(ind, 1);
};

const cssFunction = computed(() => data.function.toLowerCase().replace("_", "-"));
const bgImage = computed(() => {
	const args = [] as string[];
	switch (data.function) {
		case "LINEAR_GRADIENT": // paint is linear gradient
			args.push(`${data.angle}deg`);
			break;
		case "RADIAL_GRADIENT": // paint is radial gradient
			args.push(data.shape ?? "circle");
			break;
		case "URL": // paint is an image
			args.push(data.image_url ?? "");
			break;
	}
	let funcPrefix = "";
	if (data.function !== "URL") {
		funcPrefix = data.repeat ? "repeating-" : "";
	}

	for (const stop of data.stops) {
		const color = ConvertDecimalRGBAToString(stop.color);
		args.push(`${color} ${stop.at * 100}%`);
	}

	return `${funcPrefix}${cssFunction.value}(${args.join(", ")})`;
});

const filter = computed(() => {
	return data.shadows
		.map((v) => `drop-shadow(${v.x_offset}px ${v.y_offset}px ${v.radius}px ${ConvertDecimalRGBAToString(v.color)})`)
		.join(" ");
});

// Mutation
const create = useMutation(CreatePaint);
const doCreate = () => {
	create
		.mutate({
			def: data,
		})
		.then(() => emit("exit"));
};

const update = useMutation(UpdatePaint);
const doUpdate = () => {
	if (!data.id) {
		return;
	}

	const def = {
		name: data.name,
		function: data.function,
		color: data.color,
		angle: data.angle,
		shape: data.shape,
		image_url: data.image_url,
		repeat: data.repeat,
		stops: toRaw(data.stops).map((s) => ({ at: s.at, color: s.color })),
		shadows: toRaw(data.shadows).map((s) => ({
			color: s.color,
			radius: s.radius.toString(),
			x_offset: s.x_offset.toString(),
			y_offset: s.y_offset.toString(),
		})),
	};

	update
		.mutate({
			def,
			id: data.id,
		})
		.then(() => emit("exit"));
};

const importError = ref("");
const importData = async () => {
	importError.value = "";
	const txt = await navigator.clipboard.readText();
	let parsed: Record<string, object> = {};
	try {
		parsed = JSON.parse(txt);
	} catch (err) {
		importError.value = (err as Error).message;
	}
	for (const k of Object.keys(parsed)) {
		(data as unknown as Record<string, object>)[k] = parsed[k];
	}
};
</script>

<style scoped lang="scss">
@import "@scss/themes.scss";
.paint-builder--form {
	display: grid;
	height: 100%;
	margin-top: 1em;

	.paint-builder--divider {
		margin-top: 1em;
		margin-bottom: 1em;
	}
}

.paint-builder--stops {
	display: flex;
	flex-wrap: wrap;
	gap: 1em;

	@include themify() {
		> div {
			background-color: darken(themed("backgroundColor"), 2);
		}
	}

	label {
		font-size: 0.85rem;
	}

	> div {
		border-radius: 0.25em;
		padding: 0.5em;
	}

	.paint-builder--stop-heading {
		> svg {
			margin-right: 0.25em;
			cursor: pointer;
			color: red;
		}
	}

	.paint-builder--stop-item {
		display: flex;
		flex-wrap: wrap;
		flex-direction: column;

		> div:nth-child(1) {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 1em;
		}
		> div:nth-child(2) {
			display: flex;
			justify-content: flex-end;
		}
	}
}

.paint-builder--shadows {
	display: flex;
	flex-wrap: wrap;
	padding: 0.5em;
	gap: 1em;
	margin-top: 1em;
	margin-bottom: 1em;

	.paint-builder--shadow-form {
		display: grid;
		gap: 1.56em;
		margin-top: 0.5em;
		padding: 0.25em;
		border-radius: 0.25em;

		@include themify() {
			background-color: darken(themed("backgroundColor"), 2);
		}

		> [selector="shadow-form-area"] {
			display: grid;
			column-gap: 1em;
			grid-template-columns: auto auto;

			> .paint-builder--shadow-inputs {
				display: grid;
				gap: 0.5em;
			}
		}

		input {
			width: 1em;
		}
	}
}

.paint-builder--paints-list {
	position: sticky;
	z-index: 1;
	top: 6em;
	margin: 1em;
	@include themify() {
		background-color: themed("backgroundColor");
		box-shadow: 0.1em 0.1em 0.1em darken(themed("backgroundColor"), 4);
	}
	pointer-events: none;
	padding: 1em;
	border-radius: 0.25em;

	display: block;
	width: fit-content;
	text-align: center;
}

.paint-builder--preview {
	.paint-base {
		background-clip: text !important;
		background-size: cover !important;
		-webkit-background-clip: text !important;
		-webkit-text-fill-color: transparent;
		background-color: currentColor;
		font-weight: 700;
		color: v-bind("actorColor");
	}

	.full-paint-preview {
		background-size: cover;
		background-repeat: no-repeat;
		border-radius: 0.25em;
		margin-bottom: 1.5em;
		margin-top: 1.5em;
		width: auto;
		height: 3em;
	}
}

.paint-builder--data {
	.buttons {
		display: flex;
		gap: 1em;
	}
	> code {
		display: block;
		width: 32em;
		padding: 1em;
		color: white;
		border-radius: 0.5em;
		background-color: rgb(53, 53, 53);
		margin-top: 1em;
		margin-bottom: 1em;
	}
	> span {
		color: red;
		margin: 1em;
	}
}
</style>
