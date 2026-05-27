export const LANG_FLAGS: Record<string, string> = {
  en: "🇨🇦",
  fr: "🇫🇷",
  es: "🇪🇸",
  pt: "🇧🇷",
  tl: "🇵🇭",
  hi: "🇮🇳",
  zh: "🇨🇳",
  ru: "🇷🇺",
  ar: "🇸🇦",
  fa: "🇮🇷",
  tr: "🇹🇷",
  uk: "🇺🇦",
  vi: "🇻🇳",
  ko: "🇰🇷",
  pa: "🇮🇳",
  ur: "🇵🇰",
};

export function langFlag(code: string): string {
  return LANG_FLAGS[code] ?? "🌐";
}
