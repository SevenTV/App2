import { User } from "@/structures/User";
import gql from "graphql-tag";

export const GetUser = gql`
	query GetUser($id: String!) {
		user(id: $id) {
			id
			username
			display_name
			created_at
			avatar_url
			tag_color
			editors {
				user {
					id
					username
					display_name
					avatar_url
					tag_color
				}
			}
			roles {
				id
				name
				color
				allowed
				denied
				position
			}
			channel_emotes {
				alias
				emote {
					id
					name
					links
				}
			}
			owned_emotes {
				id
				name
				links
			}
			connections {
				id
				display_name
				platform
				linked_at
				data
			}
			inbox_unread_count
		}
	}
`;

export interface GetUser {
	user: User;
}

export const GetUserForCard = gql`
	query GetUserForCard($id: String!) {
		user(id: $id) {
			id
			display_name
			avatar_url
			tag_color
			roles {
				id
				name
				color
				allowed
				denied
				position
			}
		}
	}
`;
