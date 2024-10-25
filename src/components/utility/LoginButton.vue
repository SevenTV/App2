<template>
	<button
		v-if="actor.user === null"
		class="twitch-button"
		:platform="platform"
		@click="() => oauth2Authorize()"
		@contextmenu="selectPlatform"
	>
		<div>
			<Icon size="lg" lib="fab" :icon="platform.toLowerCase()" class="twitch-icon" />
			<span>
				{{ t("nav.sign_in").toUpperCase() }}

				<span v-if="platform === 'YOUTUBE'">WITH YOUTUBE</span>
			</span>
		</div>
	</button>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useActor } from "@/store/actor";
import { User } from "@/structures/User";
import { useAuth } from "@/composables/useAuth";
import { useContextMenu } from "@/composables/useContextMenu";
import Icon from "./Icon.vue";
import LoginButtonPlaformVue from "./LoginButtonPlaform.vue";

const actor = useActor();

const { t } = useI18n();
const auth = useAuth();

const platform = ref<User.UserConnectionPlatform>("TWITCH");

/** Request the user to authorize with a third party platform  */
const oauth2Authorize = () => {
	auth.prompt(platform.value, false);
};

const { open } = useContextMenu();

const selectPlatform = (ev: MouseEvent) => {
	open(ev, LoginButtonPlaformVue, {}).then((v) => {
		if (!v) {
			return;
		}
		platform.value = v as User.UserConnectionPlatform;
	});
};
</script>

<style scoped lang="scss">
@import "@scss/themes.scss";
@import "@scss/constants.scss";
@import "@scss/common/connection-platforms.scss";

.twitch-button {
	> div:nth-child(1) {
		display: inline-block;

		> span {
			margin-left: 0.25em;
			font-size: 0.88em;
			font-weight: 700;
			letter-spacing: 0.05em;
			text-transform: uppercase;
		}
	}

	> .separator {
		width: 0.1em;
		height: 1.25em;
		background-color: currentColor;
	}

	cursor: pointer;
	border-radius: 0.25em;
	padding: 0.25em;
	font: inherit;
	font-size: 0.88em;
	transition: background-color 200ms ease;

	&[platform="TWITCH"] {
		background-color: $twitchBrandColor;
		color: white;

		@include themify() {
			border: 0.25em solid lighten($twitchBrandColor, 12%);
		}
		&:hover {
			background-color: mix($twitchBrandColor, black, 85%);
		}
		&:focus {
			background-color: mix($twitchBrandColor, black, 70%);
		}
	}

	&[platform="YOUTUBE"] {
		// background-image: linear-gradient(90deg, white 16.5%, red 16.5%);
		background-color: white;
		color: black;

		svg {
			color: $youtubeBrandColor;
			margin-right: 0.25em;
			transform: scale(1.1);
		}

		$borderColor: darken(white, 12);
		@include themify() {
			border: 0.25em solid $borderColor;
		}
		&:hover {
			background-color: mix($borderColor, black, 85%);
		}
		&:focus {
			background-color: mix($borderColor, black, 70%);
		}
	}

	&[platform="DISCORD"] {
		background-color: $discordBrandColor;
		color: white;

		@include themify() {
			border: 0.25em solid lighten($discordBrandColor, 12%);
		}
		&:hover {
			background-color: mix($discordBrandColor, black, 85%);
		}
		&:focus {
			background-color: mix($discordBrandColor, black, 70%);
		}
	}
}
</style>
