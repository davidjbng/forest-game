import { EventEmitter } from "node:events";
import { type ChatCompletionMessage } from "~/completion.server";

declare global {
  var chatEvents: EventEmitter;
}

global.chatEvents = global.chatEvents || new EventEmitter();

export const events = global.chatEvents;

export function dispatchCommand(
  command: string,
  context: ChatCompletionMessage[]
) {
  global.chatEvents.emit("command", command, context);
}
