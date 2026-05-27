"use client";

import { useEffect, useRef, useState } from "react";
import { BigVoiceButton } from "@/components/BigVoiceButton";
import { Topbar } from "@/components/Topbar";
import { ChatScreen } from "@/components/screens/ChatScreen";
import { EndScreen } from "@/components/screens/EndScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LanguageScreen } from "@/components/screens/LanguageScreen";
import type { VoiceState } from "@/components/VoiceButton";
import type { Language } from "@/lib/languages";
import { LANGUAGES } from "@/lib/languages";
import {
  loadLanguage,
  saveLanguage,
  loadMessages,
  saveMessages,
  clearMessages,
} from "@/lib/storage";
import { createRecognizer, isSpeechSupported, type Recognizer } from "@/lib/speech";
import type { CalendarEvent } from "@/lib/calendar";
import { findTopic, topicStarter } from "@/lib/topics";
import { homeCopy } from "@/lib/designCopy";

type Screen = 1 | 2 | 3 | 4;

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  events?: CalendarEvent[];
  audioBlobUrl?: string;
  timestamp: number;
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function screenClass(n: Screen, current: Screen): string {
  return "screen s" + n + (current === n ? " active" : "");
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>(1);
  const [language, setLanguage] = useState<Language | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [topicId, setTopicId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [interim, setInterim] = useState("");
  const [typedDraft, setTypedDraft] = useState("");
  const [textMode, setTextMode] = useState(false);
  const [speechBlocked, setSpeechBlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const recRef = useRef<Recognizer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const stored = loadLanguage();
    setLanguage(stored);
    if (stored?.rtl) document.documentElement.dir = "rtl";
    else document.documentElement.dir = "ltr";
    if (stored) document.documentElement.lang = stored.code;
    if (!isSpeechSupported()) setTextMode(true);

    const storedMsgs = loadMessages();
    if (storedMsgs.length > 0) {
      setMessages(
        storedMsgs.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          events: (m.events as CalendarEvent[] | undefined) ?? [],
          timestamp: m.timestamp,
        }))
      );
    }

    if (!stored) setScreen(1);
    else if (storedMsgs.length > 0) setScreen(3);
    else setScreen(2);

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveMessages(
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        events: m.events,
        timestamp: m.timestamp,
      }))
    );
  }, [messages, hydrated]);

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeakingId(null);
  }

  function pickLanguage(lang: Language) {
    const switching = language && language.code !== lang.code;
    stopAudio();
    setLanguage(lang);
    saveLanguage(lang);
    document.documentElement.dir = lang.rtl ? "rtl" : "ltr";
    document.documentElement.lang = lang.code;
    if (switching) {
      setMessages([]);
      clearMessages();
      setTopicId(null);
    }
    setScreen(2);
  }

  function autoDetectLanguage() {
    const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
    const lang =
      LANGUAGES.find((l) => l.code === browser) ?? LANGUAGES[0];
    pickLanguage(lang);
  }

  function openChat(id: string | null, withStarter?: boolean) {
    setTopicId(id);
    setScreen(3);
    setErrorMsg(null);
    if (withStarter && language && id) {
      const topic = findTopic(id);
      if (topic) {
        const langKey = language.code === "fr" ? "fr" : "en";
        void sendQuestion(topicStarter(topic, langKey));
      }
    }
  }

  async function speakMessage(msg: Message, lang: Language) {
    stopAudio();

    let url = msg.audioBlobUrl;
    if (!url) {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: msg.text, voiceId: lang.voiceId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "TTS failed" }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        setMessages((curr) =>
          curr.map((m) => (m.id === msg.id ? { ...m, audioBlobUrl: url } : m))
        );
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Could not play audio");
        setVoiceState("idle");
        return;
      }
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setSpeakingId(msg.id);
    setVoiceState("speaking");
    audio.onended = () => {
      if (audioRef.current === audio) audioRef.current = null;
      setSpeakingId(null);
      setVoiceState("idle");
    };
    audio.onerror = () => {
      if (audioRef.current === audio) audioRef.current = null;
      setSpeakingId(null);
      setVoiceState("idle");
    };
    try {
      await audio.play();
    } catch {
      if (audioRef.current === audio) audioRef.current = null;
      setSpeakingId(null);
      setVoiceState("idle");
    }
  }

  async function sendQuestion(text: string) {
    if (!language) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    setErrorMsg(null);
    setInterim("");
    stopAudio();

    const userMsg: Message = {
      id: uid(),
      role: "user",
      text: trimmed,
      timestamp: Date.now(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setVoiceState("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          messages: next.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { text: string; events?: CalendarEvent[] };
      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        text: data.text,
        events: data.events ?? [],
        timestamp: Date.now(),
      };
      setMessages((curr) => [...curr, assistantMsg]);
      void speakMessage(assistantMsg, language);
    } catch (e) {
      setVoiceState("idle");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function tapMic() {
    if (!language) return;
    if (voiceState === "speaking") {
      stopAudio();
      setVoiceState("idle");
      return;
    }
    if (voiceState === "idle") {
      const rec = createRecognizer(language.speechCode, {
        onInterim: (t) => setInterim(t),
        onFinal: (t) => {
          setInterim("");
          recRef.current = null;
          void sendQuestion(t);
        },
        onError: (err) => {
          setInterim("");
          setVoiceState("idle");
          if (err === "not-allowed" || err === "service-not-allowed") {
            setSpeechBlocked(true);
            setTextMode(true);
          } else if (err !== "no-speech" && err !== "aborted") {
            setErrorMsg(err);
          }
        },
        onEnd: () => {
          setVoiceState((s) => (s === "listening" ? "idle" : s));
        },
      });
      if (!rec) {
        setTextMode(true);
        return;
      }
      recRef.current = rec;
      setVoiceState("listening");
      rec.start();
    } else if (voiceState === "listening") {
      recRef.current?.stop();
    }
  }

  function submitTyped() {
    if (!typedDraft.trim()) return;
    const text = typedDraft;
    setTypedDraft("");
    void sendQuestion(text);
  }

  function replayMessage(id: string) {
    if (!language) return;
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    if (speakingId === id) {
      stopAudio();
      setVoiceState("idle");
      return;
    }
    void speakMessage(msg, language);
  }

  function shareApp() {
    if (!language) return;
    const isFr = language.code === "fr";
    const text = isFr
      ? "Je viens de découvrir TalkToCanada — une IA vocale qui aide les nouveaux arrivants au Canada. talktocanada.ca 🍁"
      : "Just found TalkToCanada — a voice AI that helps newcomers to Canada. talktocanada.ca 🍁";
    void (async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: "TalkToCanada",
            text,
            url: "https://talktocanada.ca",
          });
        } else {
          await navigator.clipboard.writeText(text);
        }
      } catch {
        /* canceled */
      }
    })();
  }

  if (!hydrated) return null;

  const copy = language ? homeCopy(language) : null;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" />

      <Topbar
        language={language}
        onLangClick={() => {
          if (screen === 1) return;
          setScreen(1);
        }}
      />

      <main className="app" id="main">
        <section
          className={screenClass(1, screen)}
          aria-label="Choose your language"
          aria-hidden={screen !== 1}
        >
          <LanguageScreen onPick={pickLanguage} onAutoDetect={autoDetectLanguage} />
        </section>

        {language ? (
          <>
            <section
              className={screenClass(2, screen)}
              aria-label="Home"
              aria-hidden={screen !== 2}
            >
              <HomeScreen
                language={language}
                onVoiceOpen={() => openChat(null)}
                onTopicPick={(id) => openChat(id, true)}
              />
            </section>

            <section
              className={screenClass(3, screen)}
              aria-label="Voice session"
              aria-hidden={screen !== 3}
            >
              <ChatScreen
                language={language}
                topicId={topicId}
                messages={messages}
                interim={interim}
                voiceState={voiceState}
                errorMsg={errorMsg}
                textMode={textMode}
                typedDraft={typedDraft}
                speechBlocked={speechBlocked}
                onBack={() => setScreen(2)}
                onMic={tapMic}
                onTypedChange={setTypedDraft}
                onSubmitTyped={submitTyped}
                onTextMode={setTextMode}
                onReplay={replayMessage}
                speakingId={speakingId}
              />
            </section>

            <section
              className={screenClass(4, screen)}
              aria-label="Share or ask another"
              aria-hidden={screen !== 4}
            >
              <EndScreen
                language={language}
                onAskAnother={() => setScreen(2)}
                onShare={shareApp}
              />
            </section>
          </>
        ) : null}
      </main>

      {screen === 2 && language && copy ? (
        <div className="mobile-voice">
          <BigVoiceButton
            ariaLabel={copy.voiceLabel}
            onClick={() => openChat(null)}
          />
        </div>
      ) : null}
    </>
  );
}
