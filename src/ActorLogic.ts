import { Ref, watch } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { storeToRefs } from "pinia";
import { useActor } from "@/store/actor";
import { GetEmoteSet, GetEmoteSetMin } from "@/apollo/query/emote-set.query";
import { useObjectSubscription } from "@/composables/useObjectSub";
import { GetCurrentUser } from "./apollo/query/user-self.query";
import { GetUser } from "./apollo/query/user.query";
import { useStore } from "./store/main";
import { ObjectKind } from "./structures/Common";
import { EmoteSet } from "./structures/EmoteSet";
import { User } from "./structures/User";

export function setupActor(refreshAuth: Ref<boolean>) {
	const actor = useActor();
	const store = useStore();
	const { user } = storeToRefs(actor);
	const { watchObject } = useObjectSubscription();

	function fetch() {
		if (!refreshAuth.value) {
			return;
		}

		refreshAuth.value = false;

		// Set up initial identity (pre-fetch)
		const identity = actor.getIdentity();
		if (identity) {
			actor.setUser({ ...identity, _idty: true });
		}

		// Query user data from API
		const { onResult, onError } = useQuery<GetUser>(GetCurrentUser);
		onResult((res) => {
			if (!res.data) return;

			const usr = res.data.user;
			if (!usr) {
				actor.setUser(null);
				store.setAuthToken(null, false);
				return;
			}

			actor.setUser(usr);

			// Auto-bump slots
			// const maxSlots = Math.max(...usr.connections.map((uc) => uc.emote_capacity));
			// const bumps = [] as Promise<unknown>[];
			// for (const es of usr.emote_sets) {
			// 	if (maxSlots > es.capacity && es.capacity >= 300) {
			// 		bumps.push(m.editEmoteSet(es.id, { capacity: maxSlots }).catch(() => undefined));
			// 	}
			// }
			// if (bumps.length) {
			// 	Promise.all(bumps).then(() => {
			// 		modal.open("slots-bumped", {
			// 			component: ModalSlotsBump,
			// 			props: {
			// 				value: maxSlots,
			// 			},
			// 			events: {},
			// 		});
			// 	});
			// }

			// Aggregate owned and emote sets of edited users
			const editableSetIDs = (user.value as User).editor_of.map((ed) =>
				ed.user
					? (ed.permissions & User.EditorPermission.ManageEmoteSets) === User.EditorPermission.ManageEmoteSets
						? ed.user.emote_sets.filter((es) => es.id).map((es) => es.id)
						: ed.user.connections.filter((uc) => uc.emote_set_id).map((uc) => uc.emote_set_id)
					: [],
			);

			const editableSets =
				(editableSetIDs.length
					? editableSetIDs.reduce((a, b) => [...(a ?? []), ...(b ?? [])])?.map((v) => ({ id: v } as EmoteSet))
					: []) ?? [];

			// Start subscriptions on all editable sets
			const allOK = [] as Promise<EmoteSet>[];
			for (const set of [...usr.emote_sets, ...editableSets]) {
				const { result, loading } = useQuery<GetEmoteSet>(GetEmoteSetMin, { id: set.id });

				const p = new Promise<EmoteSet>((ok) => {
					watch(loading, (l) => !l && ok(result.value?.emoteSet as EmoteSet));
				});

				allOK.push(p);
			}

			Promise.all(allOK).then((sets) => {
				for (const set of sets) {
					if (!set) {
						continue;
					}

					watchObject(ObjectKind.EMOTE_SET, set, () => {
						actor.updateEmoteSet(set);
					});

					actor.addEmoteSet(set);
				}
				actor.updateActiveEmotes();
			});
		});

		onError((err) => {
			actor.setUser(null);
			actor.showErrorModal(err);
		});
	}

	watch(refreshAuth, () => fetch(), { immediate: true });
}
