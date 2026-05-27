export type Topic = {
  id: string;
  emoji: string;
  name: Record<string, string>;
  stat: Record<string, string>;
  starterPrompt: Record<string, string>;
};

const enStat = (n: string, label: string) =>
  `Common topic for newcomers — ${label}`;

export const TOPICS: Topic[] = [
  {
    id: "sin",
    emoji: "🪪",
    name: { en: "SIN Number", fr: "Numéro NAS" },
    stat: { en: enStat("sin", "SIN"), fr: "Sujet fréquent — NAS" },
    starterPrompt: {
      en: "How do I get my Social Insurance Number (SIN) in Canada?",
      fr: "Comment obtenir mon numéro d'assurance sociale (NAS) au Canada ?",
    },
  },
  {
    id: "doctor",
    emoji: "🏥",
    name: { en: "Finding a doctor", fr: "Trouver un médecin" },
    stat: { en: enStat("doctor", "health"), fr: "Sujet fréquent — santé" },
    starterPrompt: {
      en: "How do I find a family doctor in Canada?",
      fr: "Comment trouver un médecin de famille au Canada ?",
    },
  },
  {
    id: "bank",
    emoji: "🏦",
    name: { en: "Banking for newcomers", fr: "Banque pour nouveaux arrivants" },
    stat: { en: enStat("bank", "banking"), fr: "Sujet fréquent — banque" },
    starterPrompt: {
      en: "What is the best bank account for newcomers to Canada?",
      fr: "Quel compte bancaire convient aux nouveaux arrivants au Canada ?",
    },
  },
  {
    id: "rent",
    emoji: "🏠",
    name: { en: "Renting your first place", fr: "Louer votre premier logement" },
    stat: { en: enStat("rent", "housing"), fr: "Sujet fréquent — logement" },
    starterPrompt: {
      en: "How do I rent my first apartment in Canada?",
      fr: "Comment louer mon premier appartement au Canada ?",
    },
  },
  {
    id: "job",
    emoji: "💼",
    name: { en: "Finding a job", fr: "Trouver un emploi" },
    stat: { en: enStat("job", "work"), fr: "Sujet fréquent — emploi" },
    starterPrompt: {
      en: "How do I find a job as a newcomer in Canada?",
      fr: "Comment trouver un emploi en tant que nouvel arrivant au Canada ?",
    },
  },
  {
    id: "culture",
    emoji: "🍁",
    name: { en: "Canadian culture", fr: "Culture canadienne" },
    stat: { en: enStat("culture", "daily life"), fr: "Sujet fréquent — vie quotidienne" },
    starterPrompt: {
      en: "What should I know about Canadian culture as a newcomer?",
      fr: "Que dois-je savoir sur la culture canadienne en tant que nouvel arrivant ?",
    },
  },
  {
    id: "school",
    emoji: "📚",
    name: { en: "School & education", fr: "École & éducation" },
    stat: { en: enStat("school", "education"), fr: "Sujet fréquent — éducation" },
    starterPrompt: {
      en: "How does school enrollment work for newcomers in Canada?",
      fr: "Comment fonctionne l'inscription scolaire pour les nouveaux arrivants au Canada ?",
    },
  },
  {
    id: "community",
    emoji: "👨‍👩‍👧",
    name: { en: "Community & friends", fr: "Communauté & amis" },
    stat: { en: enStat("community", "community"), fr: "Sujet fréquent — communauté" },
    starterPrompt: {
      en: "How can I meet people and find community as a newcomer?",
      fr: "Comment rencontrer des gens et trouver une communauté en tant que nouvel arrivant ?",
    },
  },
];

export function findTopic(id: string | null): Topic | undefined {
  if (!id) return undefined;
  return TOPICS.find((t) => t.id === id);
}

export function topicLabel(topic: Topic, langCode: string): string {
  return topic.name[langCode] ?? topic.name.en;
}

export function topicStat(topic: Topic, langCode: string): string {
  return topic.stat[langCode] ?? topic.stat.en;
}

export function topicStarter(topic: Topic, langCode: string): string {
  return topic.starterPrompt[langCode] ?? topic.starterPrompt.en;
}
