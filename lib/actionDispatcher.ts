import type { AppAction } from "./actionParser";

/**
 * Map every action variant to a handler. The page wires concrete state updates.
 * Unknown action types can't reach here — they were dropped in parseActions().
 */
export type ActionHandlers = {
  switchLanguageByCode: (code: string) => void;
  setPlaybackRate: (rate: number) => void;
  repeatLast: () => void;
  setCity: (city: string) => void;
  checkoffTask: (title: string) => void;
  stop: () => void;
  resetConversation: () => void;
};

export function dispatchAction(action: AppAction, h: ActionHandlers): void {
  switch (action.type) {
    case "switch_language":
      h.switchLanguageByCode(action.to);
      return;
    case "set_playback_rate":
      h.setPlaybackRate(action.rate);
      return;
    case "repeat_last":
      h.repeatLast();
      return;
    case "set_city":
      h.setCity(action.city);
      return;
    case "checkoff_task":
      h.checkoffTask(action.title);
      return;
    case "stop":
      h.stop();
      return;
    case "reset_conversation":
      h.resetConversation();
      return;
  }
}

export function dispatchAll(actions: AppAction[], h: ActionHandlers): void {
  for (const a of actions) dispatchAction(a, h);
}
