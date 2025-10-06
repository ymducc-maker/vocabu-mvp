export type ContextId = 'law' | 'travel' | 'it' | 'senior';
export type StyleId = 'simple' | 'professional' | 'academic';
export type UILocale = 'ru' | 'en' | 'es';
export type LanguagePair = 'EN↔RU' | 'EN↔ES';

export type Goals = {
  target: string;
  languagePair: string;
  contextId: ContextId;
  style: StyleId;
  horizonDays: number;
  wordsPerDay: number;
  userText: string;
  useUserText: boolean;
};

export type Plan = {
  daily: number;
  weekly: number;
  totalWords: number;
  contextId: ContextId;
  horizonDays: number;
  todaySet: string[];
  weekPackage: string[];
};

export type PlacementDetails = {
  total: number; // всего вопросов
  correct: number; // верных ответов
  domains?: {
    // по желанию: разрез по типам
    vocab?: number;
    grammar?: number;
    context?: number;
  };
};

export type PlacementResult = {
  level: 'A2' | 'B1' | 'B2' | null;
  confidence: number; // 0..1
  details?: PlacementDetails; // может отсутствовать (работаем и так, и так)
};
