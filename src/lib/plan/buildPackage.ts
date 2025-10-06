import type { Goals } from '../../types';
import { HEADWORD_SEED } from '../../config/domain';
import { extractWords } from '../text/extractWords';

export function buildPackage(goals: Goals) {
  const weeklyTarget = Math.max(1, goals.wordsPerDay * 7);

  // 1) из пользовательского текста (только если разрешено)
  const fromText = goals.useUserText ? extractWords(goals.userText) : [];

  // 2) семена по контексту
  const seed = HEADWORD_SEED[goals.contextId] || [];

  // Склеиваем приоритетом: текст → семена
  const combined = [...fromText, ...seed];

  // Уникализируем
  const uniq = Array.from(new Set(combined)).filter(Boolean);

  const week = uniq.slice(0, weeklyTarget);
  const today = week.slice(0, goals.wordsPerDay);

  return { week, today };
}
