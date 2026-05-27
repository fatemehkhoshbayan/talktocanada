import type { Language } from "./languages";

export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  events?: unknown[];
  timestamp: number;
};

const LANG_KEY = "landed.language";
const MSGS_KEY = "landed.messages";
const MAX_STORED_MESSAGES = 10;

export function loadLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LANG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Language;
  } catch {
    return null;
  }
}

export function saveLanguage(lang: Language | null): void {
  if (typeof window === "undefined") return;
  try {
    if (lang) window.localStorage.setItem(LANG_KEY, JSON.stringify(lang));
    else window.localStorage.removeItem(LANG_KEY);
  } catch {
    /* ignore */
  }
}

export function loadMessages(): StoredMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MSGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMessages(msgs: StoredMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const tail = msgs.slice(-MAX_STORED_MESSAGES);
    window.localStorage.setItem(MSGS_KEY, JSON.stringify(tail));
  } catch {
    /* ignore */
  }
}

export function clearMessages(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(MSGS_KEY);
  } catch {
    /* ignore */
  }
}
