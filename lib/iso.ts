/**
 * ISO 639-3 (Scribe's output) ↔ ISO 639-1 (our internal codes) mapping.
 * Only covers the languages we support in lib/languages.ts.
 */

const IS3_TO_1: Record<string, string> = {
  eng: "en",
  fra: "fr",
  zho: "zh",
  cmn: "zh", // Mandarin specific
  hin: "hi",
  pan: "pa",
  spa: "es",
  ara: "ar",
  tgl: "tl",
  fil: "tl", // Filipino (Tagalog umbrella)
  urd: "ur",
  fas: "fa",
  pes: "fa", // Iranian Persian
  tur: "tr",
  ukr: "uk",
  vie: "vi",
  kor: "ko",
  por: "pt",
};

export function iso3to1(code: string | undefined | null): string | null {
  if (!code) return null;
  const k = code.toLowerCase();
  return IS3_TO_1[k] ?? null;
}

/** Used when we want to give Scribe a hint (improves accuracy when we know the lang). */
export function iso1to3(code: string): string {
  const map: Record<string, string> = {
    en: "eng",
    fr: "fra",
    zh: "zho",
    hi: "hin",
    pa: "pan",
    es: "spa",
    ar: "ara",
    tl: "tgl",
    ur: "urd",
    fa: "fas",
    tr: "tur",
    uk: "ukr",
    vi: "vie",
    ko: "kor",
    pt: "por",
  };
  return map[code] ?? "eng";
}
