/* eslint-disable @typescript-eslint/no-explicit-any */

export type Recognizer = {
  start: () => void;
  stop: () => void;
};

type Listeners = {
  onInterim: (t: string) => void;
  onFinal: (t: string) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
};

export function createRecognizer(lang: string, l: Listeners): Recognizer | null {
  if (typeof window === "undefined") return null;
  const SR =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;

  const rec = new SR();
  rec.lang = lang;
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onresult = (e: any) => {
    let interim = "";
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    if (interim) l.onInterim(interim);
    if (final) l.onFinal(final);
  };

  rec.onerror = (e: any) => {
    const msg = typeof e?.error === "string" ? e.error : "unknown";
    l.onError?.(msg);
  };

  rec.onend = () => {
    l.onEnd?.();
  };

  return {
    start: () => {
      try {
        rec.start();
      } catch (err) {
        l.onError?.(err instanceof Error ? err.message : "start failed");
      }
    },
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    },
  };
}

export function isSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}
