export type UIStrings = {
  micPromptIdle: string;
  micPromptListening: string;
  micPromptThinking: string;
  micPromptSpeaking: string;
  addToCalendar: string;
  changeLanguage: string;
  welcomeHeadline: string;
  welcomeSub: string;
  pickLanguage: string;
  typeFallback: string;
  permissionDenied: string;
  send: string;
  replay: string;
  inNDays: (n: number) => string;
  tasksHeading: string;
  cityLabel: (city: string) => string;
};

export type Language = {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
  voiceId: string;
  rtl?: boolean;
  uiStrings: UIStrings;
};

const en: UIStrings = {
  micPromptIdle: "Tap to ask a question",
  micPromptListening: "Listening",
  micPromptThinking: "Thinking",
  micPromptSpeaking: "Speaking",
  addToCalendar: "Add to Google Calendar",
  changeLanguage: "Change language",
  welcomeHeadline: "Welcome to Canada.",
  welcomeSub: "Ask anything about settling in. Your answers, in your language.",
  pickLanguage: "Choose your language",
  typeFallback: "Type your question",
  permissionDenied: "Microphone blocked. You can type instead.",
  send: "Send",
  replay: "Replay",
  inNDays: (n) => (n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`),
  tasksHeading: "Things to do",
  cityLabel: (city) => `${city}`,
};

const fr: UIStrings = {
  micPromptIdle: "Touchez pour poser une question",
  micPromptListening: "À l'écoute",
  micPromptThinking: "Réflexion",
  micPromptSpeaking: "Réponse",
  addToCalendar: "Ajouter à Google Agenda",
  changeLanguage: "Changer de langue",
  welcomeHeadline: "Bienvenue au Canada.",
  welcomeSub: "Posez vos questions sur votre installation. Des réponses claires, dans votre langue.",
  pickLanguage: "Choisissez votre langue",
  typeFallback: "Tapez votre question",
  permissionDenied: "Microphone bloqué. Vous pouvez écrire à la place.",
  send: "Envoyer",
  replay: "Réécouter",
  inNDays: (n) =>
    n === 0 ? "Aujourd'hui" : n === 1 ? "Demain" : `Dans ${n} jours`,
  tasksHeading: "À faire",
  cityLabel: (city) => `${city}`,
};

const pa: UIStrings = {
  micPromptIdle: "ਸਵਾਲ ਪੁੱਛਣ ਲਈ ਟੈਪ ਕਰੋ",
  micPromptListening: "ਸੁਣ ਰਿਹਾ ਹਾਂ",
  micPromptThinking: "ਸੋਚ ਰਿਹਾ ਹਾਂ",
  micPromptSpeaking: "ਜਵਾਬ",
  addToCalendar: "ਗੂਗਲ ਕੈਲੰਡਰ ਵਿੱਚ ਜੋੜੋ",
  changeLanguage: "ਭਾਸ਼ਾ ਬਦਲੋ",
  welcomeHeadline: "ਕੈਨੇਡਾ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ।",
  welcomeSub: "ਆਪਣੀ ਨਵੀਂ ਜ਼ਿੰਦਗੀ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ। ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਜਵਾਬ ਮਿਲਣਗੇ।",
  pickLanguage: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",
  typeFallback: "ਆਪਣਾ ਸਵਾਲ ਟਾਈਪ ਕਰੋ",
  permissionDenied: "ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਬੰਦ ਹੈ। ਤੁਸੀਂ ਟਾਈਪ ਕਰ ਸਕਦੇ ਹੋ।",
  send: "ਭੇਜੋ",
  replay: "ਮੁੜ ਸੁਣੋ",
  inNDays: (n) => (n === 0 ? "ਅੱਜ" : n === 1 ? "ਕੱਲ੍ਹ" : `${n} ਦਿਨਾਂ ਵਿੱਚ`),
  tasksHeading: "ਕਰਨ ਵਾਲੇ ਕੰਮ",
  cityLabel: (city) => `${city}`,
};

const hi: UIStrings = {
  micPromptIdle: "सवाल पूछने के लिए टैप करें",
  micPromptListening: "सुन रहा हूँ",
  micPromptThinking: "सोच रहा हूँ",
  micPromptSpeaking: "जवाब",
  addToCalendar: "गूगल कैलेंडर में जोड़ें",
  changeLanguage: "भाषा बदलें",
  welcomeHeadline: "कनाडा में आपका स्वागत है।",
  welcomeSub: "अपनी नई ज़िंदगी के बारे में कुछ भी पूछें। आपकी भाषा में जवाब।",
  pickLanguage: "अपनी भाषा चुनें",
  typeFallback: "अपना सवाल टाइप करें",
  permissionDenied: "माइक्रोफ़ोन बंद है। आप टाइप कर सकते हैं।",
  send: "भेजें",
  replay: "फिर से सुनें",
  inNDays: (n) => (n === 0 ? "आज" : n === 1 ? "कल" : `${n} दिनों में`),
  tasksHeading: "करने के काम",
  cityLabel: (city) => `${city}`,
};

// Reusable multilingual voice. Aria is a default ElevenLabs voice and works with eleven_multilingual_v2.
const ARIA = "9BWtsMINqrJLrRacOk9x";

export const LANGUAGES: Language[] = [
  { code: "en", name: "English",     nativeName: "English",     speechCode: "en-CA", voiceId: ARIA, uiStrings: en },
  { code: "fr", name: "French",      nativeName: "Français",    speechCode: "fr-CA", voiceId: ARIA, uiStrings: fr },
  { code: "zh", name: "Mandarin",    nativeName: "中文",         speechCode: "zh-CN", voiceId: ARIA, uiStrings: en },
  { code: "hi", name: "Hindi",       nativeName: "हिन्दी",       speechCode: "hi-IN", voiceId: ARIA, uiStrings: hi },
  { code: "pa", name: "Punjabi",     nativeName: "ਪੰਜਾਬੀ",       speechCode: "pa-IN", voiceId: ARIA, uiStrings: pa },
  { code: "es", name: "Spanish",     nativeName: "Español",     speechCode: "es-ES", voiceId: ARIA, uiStrings: en },
  { code: "ar", name: "Arabic",      nativeName: "العربية",      speechCode: "ar-SA", voiceId: ARIA, rtl: true, uiStrings: en },
  { code: "tl", name: "Tagalog",     nativeName: "Tagalog",     speechCode: "en-PH", voiceId: ARIA, uiStrings: en },
  { code: "ur", name: "Urdu",        nativeName: "اردو",         speechCode: "ur-PK", voiceId: ARIA, rtl: true, uiStrings: en },
  { code: "fa", name: "Persian",     nativeName: "فارسی",        speechCode: "fa-IR", voiceId: ARIA, rtl: true, uiStrings: en },
  { code: "tr", name: "Turkish",     nativeName: "Türkçe",      speechCode: "tr-TR", voiceId: ARIA, uiStrings: en },
  { code: "uk", name: "Ukrainian",   nativeName: "Українська",  speechCode: "uk-UA", voiceId: ARIA, uiStrings: en },
  { code: "vi", name: "Vietnamese",  nativeName: "Tiếng Việt",  speechCode: "vi-VN", voiceId: ARIA, uiStrings: en },
  { code: "ko", name: "Korean",      nativeName: "한국어",        speechCode: "ko-KR", voiceId: ARIA, uiStrings: en },
  { code: "pt", name: "Portuguese",  nativeName: "Português",   speechCode: "pt-BR", voiceId: ARIA, uiStrings: en },
];

export function findLanguage(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}
