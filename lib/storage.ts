import type { Language } from "./languages";

export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  events?: unknown[];
  timestamp: number;
};

export type StoredTask = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "med" | "low";
  done: boolean;
  createdAt: number;
};

const LANG_KEY = "landed.language";
const MSGS_KEY = "landed.messages";
const TASKS_KEY = "landed.tasks";
const CITY_KEY = "landed.city";
const RATE_KEY = "landed.playbackRate";
const MAX_STORED_MESSAGES = 10;
const MAX_STORED_TASKS = 50;

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function remove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// Language
export function loadLanguage(): Language | null {
  return readJSON<Language | null>(LANG_KEY, null);
}
export function saveLanguage(lang: Language | null): void {
  if (lang) writeJSON(LANG_KEY, lang);
  else remove(LANG_KEY);
}

// Messages
export function loadMessages(): StoredMessage[] {
  const value = readJSON<StoredMessage[]>(MSGS_KEY, []);
  return Array.isArray(value) ? value : [];
}
export function saveMessages(msgs: StoredMessage[]): void {
  writeJSON(MSGS_KEY, msgs.slice(-MAX_STORED_MESSAGES));
}
export function clearMessages(): void {
  remove(MSGS_KEY);
}

// Tasks
export function loadTasks(): StoredTask[] {
  const value = readJSON<StoredTask[]>(TASKS_KEY, []);
  return Array.isArray(value) ? value : [];
}
export function saveTasks(tasks: StoredTask[]): void {
  writeJSON(TASKS_KEY, tasks.slice(-MAX_STORED_TASKS));
}
export function clearTasks(): void {
  remove(TASKS_KEY);
}

// City
export function loadCity(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CITY_KEY);
  } catch {
    return null;
  }
}
export function saveCity(city: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (city) window.localStorage.setItem(CITY_KEY, city);
    else window.localStorage.removeItem(CITY_KEY);
  } catch {
    /* ignore */
  }
}

// Playback rate
export function loadPlaybackRate(): number {
  if (typeof window === "undefined") return 1.0;
  try {
    const raw = window.localStorage.getItem(RATE_KEY);
    if (!raw) return 1.0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 1.0;
  } catch {
    return 1.0;
  }
}
export function savePlaybackRate(rate: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RATE_KEY, String(rate));
  } catch {
    /* ignore */
  }
}
