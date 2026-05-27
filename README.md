# TalkToCanada

Voice-first AI settlement companion for newcomers to Canada. Speak in any of
90+ languages; get clear, voice answers about SIN, health cards, IRCC,
banking, housing, taxes, and PR. Critical appointments go straight to Google
Calendar. Built for newcomers, international students, seniors, and
visually-impaired users.

## What it does

1. You tap once. Mic permission is requested on that first tap.
2. You speak in any language.
3. ElevenLabs Scribe transcribes your audio and auto-detects the language.
4. Claude Sonnet 4.6 responds in that language, in plain sixth-grade prose,
   tailored to your province if you've told it your city.
5. ElevenLabs Multilingual v2 reads the answer aloud.
6. If the answer involves an appointment, a one-tap "Add to Google Calendar"
   button appears below the message.
7. If the answer involves a non-dated to-do, it joins your persistent
   checklist that survives refreshes and can be checked off by voice.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first `@theme` tokens)
- Claude Sonnet 4.6 for the brain (multilingual, structured-output protocol)
- ElevenLabs Scribe v2 for STT (auto-detect, 90+ languages)
- ElevenLabs Multilingual v2 for TTS
- Google Calendar pre-filled URL — no OAuth, no friction
- `localStorage` for state (language, last 10 messages, tasks, city, playback rate)

## Voice-first design

The whole app is operable without sight or keyboard. Specifically:

- **Auto language detection.** First utterance through ElevenLabs Scribe
  detects the spoken language. No visual picker required to enter the app.
- **Multilingual welcome screen.** Six greetings stacked in different
  scripts, each tagged with the correct `lang` attribute for screen readers.
- **Big mic target.** 140px circular button, the dominant element on the
  page. 3px focus ring at 3px offset for keyboard users.
- **ARIA live region.** Every voice-state transition (Listening, Thinking,
  Speaking) is announced to assistive tech.
- **Keyboard shortcuts.**
  - `Space` — toggle the mic from anywhere on the page
  - `Enter` — replay the last assistant message
  - `Escape` — stop playback
- **Skip-to-main-content link** as the first focusable element.
- **No information conveyed by color alone.** Status uses dot + label + icon.

## Voice commands

Spoken naturally during conversation. Claude maps them to structured `action`
blocks that the app dispatches.

| Say | Effect |
|-----|--------|
| "switch to French", "in English from now on" | Change language |
| "slow down", "speak slower", "too fast" | TTS at 0.8× |
| "speak faster", "speed up" | TTS at 1.2× |
| "normal speed" | TTS at 1.0× |
| "repeat", "say it again", "one more time" | Replay last message |
| "I'm in Toronto", "I just moved to Montreal" | Set your city (persists) |
| "I did X", "I finished X", "I got my SIN" | Check off a task |
| "stop", "be quiet", "pause" | Stop playback |
| "start over", "new conversation" | Wipe history and tasks |

## Architecture

```
Tap mic ─► MediaRecorder ─► /api/transcribe ─► ElevenLabs Scribe
                                                      │
                                              text + language_code
                                                      ▼
                                            (auto-switch language)
                                                      │
                                                      ▼
        ┌────────────────► /api/chat ─► Claude Sonnet 4.6
        │                                     │
        │                          prose + event + task + action blocks
        │                                     │
        │   ┌─────────────────────────────────┼──────────────────┐
        │   ▼                                 ▼                  ▼
        │  /api/tts ─► audio                CalendarButton    actionDispatcher
        │   │                                 (GCal URL)       │
        │   ▼                                                  ├─► switch language
        │ HTMLAudioElement (rate adjustable)                   ├─► set playback rate
        │                                                      ├─► repeat last
        │                                                      ├─► set city
        │                                                      ├─► check off task
        │                                                      ├─► stop
        │                                                      └─► reset conversation
        │
        └─ openTasks + city included in each chat request so Claude
           has full context.
```

Server routes are thin proxies — Anthropic and ElevenLabs keys never reach
the browser.

## Run locally

```bash
npm install
cp .env.example .env.local       # fill in keys
npm run dev
```

Open <http://localhost:3000> in Chrome, Edge, Safari, or Brave. Firefox is
not supported for audio recording at the time of writing.

| Env var | Source |
|---------|--------|
| `ANTHROPIC_API_KEY` | <https://console.anthropic.com> |
| `ELEVENLABS_API_KEY` | <https://elevenlabs.io> (used for both Scribe STT and TTS) |

No Google API key. No OAuth. Calendar events open the standard `calendar.google.com/render` URL with everything pre-filled — one tap to confirm.

## Project layout

```
app/
  layout.tsx                  # mounts skip-link + LiveRegion
  page.tsx                    # main client view, recorder + chat + actions
  globals.css                 # @theme tokens, fonts, animations, Hallmark stamp
  api/
    chat/route.ts             # Anthropic proxy, parses events/tasks/actions
    transcribe/route.ts       # ElevenLabs Scribe proxy (STT)
    tts/route.ts              # ElevenLabs Multilingual v2 proxy
components/
  StartGate.tsx               # multilingual welcome, primary entry
  LanguageGate.tsx            # secondary manual language picker
  VoiceButton.tsx             # 140px mic, 4 visual states
  StatusIndicator.tsx
  Transcript.tsx
  MessageBubble.tsx           # replay button, RTL-aware
  CalendarButton.tsx          # opens GCal URL
  TaskList.tsx                # persistent checklist
  LiveRegion.tsx              # invisible ARIA announcer + `announce()` helper
lib/
  languages.ts                # 15 languages, RTL flag, voice IDs, UI strings
  prompts.ts                  # system prompt with action/event/task protocols
  recorder.ts                 # MediaRecorder helper
  iso.ts                      # ISO 639-3 ↔ 639-1 mapper
  speech.ts                   # legacy Web Speech fallback (unused by default)
  eventParser.ts              # ```event ``` blocks (dated → GCal)
  taskParser.ts               # ```task  ``` blocks (non-dated → TaskList)
  actionParser.ts             # ```action``` blocks (voice commands)
  actionDispatcher.ts
  elevenlabs.ts
  calendar.ts                 # buildGCalUrl
  storage.ts                  # localStorage: language, messages, tasks, city, rate
```

## Design

Calm-and-trustworthy palette in OKLCH — deep navy paper, warm off-white ink,
soft amber accent used only as a highlighter (well under 5% of any viewport).
Type pairing: Fraunces (display serif) + Geist (body sans). All design
tokens live in `@theme` in `app/globals.css`; no component contains an
inline hex or `rgb()`.

The UI was reviewed against the [Hallmark](https://github.com/nutlope/hallmark)
anti-AI-slop design rules. The pre-emit self-critique is stamped at the top
of `app/globals.css`.

## License

MIT.
