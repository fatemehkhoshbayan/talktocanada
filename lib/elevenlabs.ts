import type { Language } from "./languages";

export function voiceIdFor(language: Language): string {
  return language.voiceId;
}
