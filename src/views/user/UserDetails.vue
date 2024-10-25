<template>
	<div class="user-details">
		<!-- User Card -->
		<div class="user-card-wrapper">
			<div v-if="ctx.user" class="user-card">
				<div selector="profile-picture">
					<UserTag :user="ctx.user" scale="3em" text-scale="0em" />
				</div>
				<div selector="tag">
					<UserTag :user="ctx.user" :hide-avatar="true" :cosmetics="true" />
					<p selector="bio">{{ ctx.user.biography }}</p>
				</div>
			</div>
		</div>

		<div :style="{ height: '6em' }"></div>
		<!-- Role List -->
		<div v-if="ctx.user && roles.length" class="user-roles">
			<h3 class="user-details-section">{{ t("user.roles").toUpperCase() }}</h3>
			<UserRoleList :user="ctx.user" />
		</div>

		<div
			v-if="ctx.user && actorCanManageProfile && actorCanEdit"
			class="settings-btn"
			:style="{ marginBottom: '1em' }"
		>
			<router-link
				:to="{ name: 'UserSettings', params: { user: ctx.user.id } }"
				class="user-button unstyled-link"
				color="primary"
			>
				{{ t("user.settings.button") }}
			</router-link>
			<div v-if="actor.id && actor.id === ctx.user.id" class="user-button" color="primary" @click="logout">
				{{ t("user.settings.sign_out") }}
			</div>
		</div>

		<!-- Sign Up Date -->
		<div class="user-metadata">
			<div v-if="ctx.user" sign-up-date>
				<Icon icon="calendar-alt" />
				<span> {{ t("user.joined_at", [createdAt]) }}</span>
			</div>
		</div>

		<!-- Connections -->
		<div v-if="ctx.user && connections?.length" class="user-connections">
			<!-- Connector -->
			<div v-if="actorCanEdit && connections" class="user-connector">
				<h3 class="user-details-section">{{ t("user.new_connections").toUpperCase() }}</h3>
				<div
					v-if="!connections.some((c) => c.platform === 'TWITCH')"
					class="connect-button with-gradient"
					platform="TWITCH"
					@click="linkAccount('TWITCH')"
				>
					<Icon lib="fab" icon="twitch" />
				</div>

				<div
					v-if="!connections.some((c) => c.platform === 'DISCORD')"
					class="connect-button with-gradient"
					platform="DISCORD"
					@click="linkAccount('DISCORD')"
				>
					<Icon lib="fab" icon="discord" />
				</div>

				<!-- <div
					v-if="!connections.some((c) => c.platform === 'KICK')"
					class="connect-button with-gradient"
					platform="KICK"
					@click="linkAccount('KICK')"
				>
					<LogoKick />
				</div> -->
			</div>

			<!-- Editors -->
			<div v-if="ctx.user.editors?.length || actorCanManageEditors" class="user-editors">
				<h3 class="user-details-section">{{ t("user.editors").toUpperCase() }}</h3>
				<div
					v-for="ed of ctx.user.editors"
					:key="ed.id"
					class="editor"
					:style="{
						backgroundColor: ed.user?.style.color
							? ConvertIntColorToHex(ed.user?.style.color ?? 0, 0.25)
							: '',
					}"
				>
					<UserTag v-if="ed.user" :clickable="true" scale="1.5em" :user="ed.user" :cosmetics="true" />

					<Icon
						v-if="actorCanManageEditors"
						icon="user-pen"
						class="revoke-editor"
						@click="modifyEditor(ed)"
					/>
				</div>
				<div v-if="actorCanManageEditors" v-wave class="editor add-editor-button" @click="modifyEditor()">
					<Icon icon="user-plus" />
					<span>{{ t("user.add_editor") }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";
import { useActor } from "@store/actor";
import { useModal } from "@store/modal";
import { Permissions } from "@/structures/Role";
import { User } from "@/structures/User";
import { ConvertIntColorToHex } from "@/structures/util/Color";
import { useAuth } from "@/composables/useAuth";
import { useContext } from "@/composables/useContext";
// import LogoKick from "@/components/base/LogoKick.vue";
import Icon from "@/components/utility/Icon.vue";
import UserTag from "@/components/utility/UserTag.vue";
import UserEditorModal from "./UserEditorModal.vue";
import formatDate from "date-fns/fp/format";

const UserRoleList = defineAsyncComponent(() => import("@/components/utility/UserRoleList.vue"));

const { t } = useI18n();

const actor = useActor();
const auth = useAuth();

const ctx = useContext("USER");
if (!ctx) throw new Error("No user context provided");

const roles = computed(() => (User.GetRoles(ctx.user) ?? []).filter((r) => !r.invisible));
const connections = computed(() =>
	ctx.user.connections?.map((c) => ({
		...c,
	})),
);
const createdAt = computed(() =>
	ctx.user.created_at ? formatDate("MMMM d, y")(new Date(ctx.user.created_at ?? 0)) : "",
);

const actorCanEdit = computed(() =>
	!ctx.user ? false : actor.hasEditorPermission(ctx.user, User.EditorPermission.ManageEmoteSets),
);

const actorCanManageProfile = computed(
	() =>
		User.HasPermission(actor.user, Permissions.ManageUsers) ||
		(ctx.user && actor.user && ctx.user.id === actor.user.id),
);

const actorCanManageEditors = computed(
	() => ctx.user && actor.hasEditorPermission(ctx.user, User.EditorPermission.ManageEditors),
);

const linkAccount = (platform: User.Connection.Platform) => {
	if (platform === "YOUTUBE" || platform === "KICK") {
		return;
	}

	auth.prompt(platform, true);
};

const modal = useModal();
const modifyEditor = (editor?: User.Editor) => {
	modal.open("modify-editor", {
		component: UserEditorModal,
		props: { user: ctx.user, editor },
		events: {
			editors: (newList: User.Editor[]) => {
				if (!ctx.user.id) {
					return;
				}

				ctx.user.editors = newList;
			},
		},
	});
};

const logout = () => {
	auth.logout();
	actor.user = null;
};
</script>

<style lang="scss" scoped>
@import "@scss/themes.scss";
@import "@scss/common/connection-platforms.scss";

$sideWidth: 24rem;
$smallWidth: 800px;

.user-details {
	width: $sideWidth;

	@include themify() {
		background-color: themed("navBackgroundColor");

		.user-card {
			background-color: transparentize(themed("navBackgroundColor"), 0.5);
			backdrop-filter: blur(1em);
		}
	}

	h3.user-details-section {
		font-size: 75%;
		margin-bottom: 0.25em;

		@include themify() {
			color: mix(themed("backgroundColor"), themed("color"));
		}
	}

	.user-card-wrapper {
		position: sticky;
		top: 4.5em;
		z-index: 20;
	}
	.user-card-wrapper > .user-card {
		display: flex;
		flex-direction: row;
		position: absolute;
		width: 100%;

		> [selector="profile-picture"] {
			border-bottom-right-radius: 1em;
			padding: 0.5em;
		}
		> [selector="tag"] {
			padding: 0.5em;
			padding-left: 0.15em;
			height: fit-content;
			border-top-right-radius: 0.5em;
			border-bottom-right-radius: 0.5em;

			> [selector="bio"] {
				font-size: 0.75em;
				max-height: 5em;
				word-wrap: break-word;
				overflow: hidden;
				margin-right: 4em;
				@include themify() {
					color: mix(themed("color"), themed("backgroundColor"));
				}
			}
		}

		@media screen and (max-width: $smallWidth) {
			width: 100%;
			border-radius: 0;

			> [profile-picture] {
				padding: 1em;
			}
			> [tag] {
				font-size: 1.5em;
			}
		}
	}

	> .user-roles {
		display: flex;
		flex-direction: column;
		align-content: space-between;
		width: 100%;
		justify-content: center;
		margin-bottom: 1em;
		margin-left: 0.5em;
	}

	> .settings-btn {
		display: grid;
		row-gap: 0.1em;

		> .user-button {
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			background-color: blue;
			font-size: 1.25em;
			width: 100%;
			height: 2.5em;

			@include themify() {
				background-color: lighten(themed("backgroundColor"), 4);
				&:hover {
					background-color: lighten(themed("backgroundColor"), 6);
				}
			}
		}
	}

	.user-metadata {
		margin-bottom: 1em;
		margin-left: 0.5em;

		@include themify() {
			span {
				color: mix(themed("color"), rgb(175, 175, 175));
			}
		}

		> div > span {
			margin-left: 0.33em;
		}
	}

	div[platform="TWITCH"] {
		color: white;
		border-color: darken($twitchBrandColor, 15);
		background-color: $twitchBrandColor;
	}
	div[platform="YOUTUBE"] {
		color: white;
		border-color: darken($youtubeBrandColor, 15);
		background-color: $youtubeBrandColor;

		&.with-gradient {
			background-image: radial-gradient(
				circle at center,
				transparentize(lighten($youtubeBrandColor, 20), 0.25) 0%,
				$youtubeBrandColor 75%
			);
		}
	}
	div[platform="DISCORD"] {
		color: white;
		border-color: darken($discordBrandColor, 7.5);
		background-color: $discordBrandColor;

		&.with-gradient {
			background-image: radial-gradient(
				circle at center,
				transparentize(lighten($discordBrandColor, 20), 0.25) 0%,
				$discordBrandColor 75%
			);
		}
	}

	div[platform="KICK"] {
		background-color: $kickBrandColor;
	}

	div.user-connector {
		display: flex;
		flex-wrap: wrap;
		column-gap: 0.25rem;
		margin-bottom: 1em;
		margin-left: 0.5em;

		> h3 {
			width: 100%;
		}

		div.connect-button {
			cursor: pointer;
			display: grid;
			place-items: center;
			border-radius: 0.2em;
			width: 3em;
			height: 3em;

			transition: opacity linear 50ms;
			opacity: 0.75;
			&:hover:not(.disabled) {
				opacity: 1;
			}

			&.disabled {
				cursor: default;
				filter: grayscale(1);
			}

			> :first-child {
				font-size: 1.5em;
			}
		}
	}

	.user-editors {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25em;
		margin-left: 0.5em;

		> h3 {
			width: 100%;
		}

		.editor {
			display: grid;
			grid-template-columns: auto auto;
			align-items: center;
			gap: 0.25em;
			width: fit-content;
			border-radius: 0.3rem;

			padding: 0.66em;

			@include themify() {
				background-color: transparentize(themed("color"), 0.75);

				&.add-editor-button {
					background-color: transparentize(themed("primary"), 0.25);
				}
			}

			&.add-editor-button,
			> .revoke-editor {
				cursor: pointer;
			}
		}
	}
}
</style>
