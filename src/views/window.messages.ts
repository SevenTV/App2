export type WindowSelfMessage =
	| { event: "LOGIN_TOKEN"; token: string }
	| { event: "LOGIN_FAILED" }
	| { event: "LOGIN_LINKED" }
	| { event: "LOGOUT_SUCCESS" };

export function publishSelfMessage(event: WindowSelfMessage) {
	if (!window.opener) throw new Error("No window.opener");

	window.opener.postMessage(event, window.origin);
}
