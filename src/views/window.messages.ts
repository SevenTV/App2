export type WindowMessage =
	| { event: "LOGIN_TOKEN"; token: string }
	| { event: "LOGIN_FAILED" }
	| { event: "LOGIN_LINKED" }
	| { event: "LOGOUT_SUCCESS" };

export function publishMessage(event: WindowMessage, origin = window.origin) {
	if (!window.opener) throw new Error("No window.opener");

	window.opener.postMessage(event, origin);
}
