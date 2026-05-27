import type { Language } from "./languages";

export const WELCOME_CYCLE: Record<string, string[]> = {
  en: ["Welcome.", "Bienvenue.", "Bienvenido.", "Добро пожаловать."],
  fr: ["Bienvenue.", "Welcome.", "Bienvenido.", "Добро пожаловать."],
};

export function welcomePhrases(lang: Language): string[] {
  return WELCOME_CYCLE[lang.code] ?? WELCOME_CYCLE.en;
}

export function homeCopy(lang: Language) {
  const isFr = lang.code === "fr";
  return {
    headline: isFr
      ? "Avec quoi pouvons-nous vous aider aujourd'hui ?"
      : "What do you need help with today?",
    sub: isFr
      ? "Appuyez sur le bouton et parlez. Ou choisissez un sujet ci-dessous."
      : "Tap the button and just talk. Or pick a topic below.",
    voiceLabel: isFr ? "Posez une question à Maple" : "Ask Maple anything",
    popLabel: isFr
      ? "Sujets fréquents pour les nouveaux arrivants"
      : "Popular topics for newcomers",
    counterLabel: isFr
      ? "personnes ont utilisé TalkToCanada aujourd'hui"
      : "people used TalkToCanada today",
    welcomeQ: isFr ? "Quelle langue parlez-vous ?" : "What language do you speak?",
    autoDetect: isFr
      ? "Détecter ma langue automatiquement →"
      : "Detect my language automatically →",
    openQuestion: isFr ? "Question libre" : "Open question",
    back: isFr ? "Retour" : "Back",
    s4Headline: isFr ? "Tout va bien se passer ici." : "You're going to be okay here.",
    s4Sub: isFr
      ? "Maple est là quand vous avez une autre question."
      : "Maple is here whenever you have another question.",
    askAnother: isFr ? "Poser une autre question" : "Ask another question",
    share: isFr ? "Partager TalkToCanada" : "Share TalkToCanada",
    s4Foot: isFr
      ? "Conçu pour les personnes qui arrivent au Canada chaque année."
      : "Built for people who arrive in Canada every year.",
  };
}
