import type { WorkerMessage, WorkerMessageData, WorkerMessageName } from "@/composables/useWorker";
import { EventAPI } from "./worker.events";
import { log } from "@/Logger";

log.setContextName("Worker");

const eventAPI = new EventAPI();
eventAPI.connect("WebSocket");

export function handleMessage<N extends WorkerMessageName>(evt: WorkerMessage<N>): void {
	switch (evt.name) {
		case "EventCommandSubscribe": {
			const d = evt.data as WorkerMessageData<"EventCommandSubscribe">;
			eventAPI.subscribe(d.type, d.condition);
			break;
		}
		case "EventCommandUnsubscribe": {
			const d = evt.data as WorkerMessageData<"EventCommandUnsubscribe">;
			eventAPI.unsubscribe(d.type, d.condition);
			break;
		}
	}
}

export function broadcast<N extends WorkerMessageName>(name: N, data: WorkerMessageData<N>): void {
	if (target.callback) {
		target.callback({
			name,
			data,
		});
	}
}

export const target = {
	callback: null as ((evt: WorkerMessage<WorkerMessageName>) => void) | null,
};
