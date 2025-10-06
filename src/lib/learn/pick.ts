import { VOCAB } from '../../config/vocab';
import type { ContextId, VocabEntry } from '../../types';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickFromContext(ctx: ContextId, n: number): VocabEntry[] {
  const base = VOCAB[ctx] ?? [];
  if (base.length <= n) return shuffle(base);
  return shuffle(base).slice(0, n);
}

export function makeMCQ(
  entry: VocabEntry,
  pool: VocabEntry[],
  langPair: string
): {
  prompt: string;
  options: string[];
  answerIndex: number;
} {
  const useRu = langPair.includes('↔RU');
  const correct = useRu ? entry.ru : entry.en; // если EN↔RU — спрашиваем перевод на RU
  const prompt = useRu ? entry.en : entry.ru;

  const distractors = shuffle(pool.filter((x) => x.id !== entry.id))
    .slice(0, 3)
    .map((x) => (useRu ? x.ru : x.en));

  const options = shuffle([correct, ...distractors]);
  const answerIndex = options.indexOf(correct);

  return { prompt, options, answerIndex };
}
