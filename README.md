# Landed

Voice-first immigration assistant for newcomers to Canada. Speak in your
language. Get clear answers about SIN, health cards, IRCC, banking, housing,
driver's licenses, taxes, and PR. Critical appointments go straight to Google
Calendar so you never miss a deadline.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first `@theme` tokens — no `tailwind.config.ts`)
- Claude Sonnet 4.6 for the brain (multilingual, calendar event protocol)
- ElevenLabs Multilingual v2 for the voice
- Web Speech API for speech-to-text (browser-native)
- Google Calendar pre-filled URL — no OAuth, no friction

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in keys
npm run dev
```

Open <http://localhost:3000>.

## Environment

| Key                  | Source                          | Used in                |
|----------------------|---------------------------------|------------------------|
| `ANTHROPIC_API_KEY`  | <https://console.anthropic.com> | `app/api/chat/route.ts` |
| `ELEVENLABS_API_KEY` | <https://elevenlabs.io>         | `app/api/tts/route.ts`  |

There is no Google API key. The "Add to Google Calendar" buttons open a
pre-filled URL — Google's calendar handles the auth and save in one click.

## Browser support

Speech-to-text uses the Web Speech API, which works in **Chrome, Edge, Safari
(macOS and iOS), and Brave**. Firefox does not support it; in Firefox, the
voice button automatically falls back to a text input. Microphone permission
is requested on first tap, not on load.

## Supported languages (15)

English, French, Mandarin, Hindi, Punjabi, Spanish, Arabic (RTL), Tagalog,
Urdu (RTL), Persian (RTL), Turkish, Ukrainian, Vietnamese, Korean, Portuguese.

UI strings are localized for English, French, Punjabi, and Hindi. Other
languages keep English UI labels — the answers from Claude still come back in
the selected language.

## How it works

1. Pick your language. Choice is saved to `localStorage`.
2. Tap the mic. Web Speech API transcribes in your language locally in the
   browser.
3. The final transcript goes to `/api/chat`, which calls Claude Sonnet 4.6
   with a system prompt that enforces: respond in your language, sixth-grade
   plain language, never invent fees or dates, append a fenced ` ```event `
   block whenever there's an appointment to remember.
4. Claude returns the prose answer plus zero or more event blocks. The
   frontend parses them out, hides them from the displayed text, and renders
   "Add to Google Calendar" buttons below the message.
5. The cleaned prose is sent to `/api/tts`, which calls ElevenLabs
   Multilingual v2. The returned MP3 plays in the browser and is cached on
   the message for one-tap replay.
6. Tapping a calendar button opens `calendar.google.com/calendar/render`
   with the event title, description, and a sensible date (default: N days
   from now at 10:00) pre-filled. The user saves it with one click.

## Try these questions

- "I just landed in Toronto, what do I do this week?"
- "How do I get a SIN number?"
- "How do I open a bank account as a newcomer?"
- "When can I apply for my health card in Ontario?"
- "How do I file taxes if I arrived in October?"

## Architecture

```
app/
  layout.tsx
  page.tsx                     # single client view: gate → main
  globals.css                  # @theme tokens, fonts, animations
  api/
    chat/route.ts              # Claude proxy
    tts/route.ts               # ElevenLabs proxy
components/
  LanguageGate.tsx
  VoiceButton.tsx              # 4 visual states: idle, listening, thinking, speaking
  StatusIndicator.tsx
  Transcript.tsx
  MessageBubble.tsx
  CalendarButton.tsx
lib/
  languages.ts                 # 15 languages, RTL flag, voice IDs, UI strings
  prompts.ts                   # system prompt with event-block protocol
  speech.ts                    # Web Speech API wrapper
  elevenlabs.ts
  calendar.ts                  # buildGCalUrl
  eventParser.ts               # regex extractor for ```event blocks
  storage.ts                   # localStorage for language + last 10 messages
```

State lives in React, mirrored to `localStorage`. No DB. No auth. Conversation
survives a refresh.

## Design

The visual language is intentionally calm and trustworthy — deep navy paper,
warm off-white ink, soft amber accent used only as a highlighter (well under
5% of any viewport). Type pairing: Fraunces (display, calm serif) + Geist
(body, restrained sans). All colors are OKLCH; all design tokens live in
`@theme` in `app/globals.css`; no component contains an inline hex or `rgb()`.

The UI was reviewed against the [Hallmark](https://github.com/nutlope/hallmark)
anti-AI-slop design rules. The pre-emit self-critique is stamped at the top of
`app/globals.css`.

## License

MIT.
