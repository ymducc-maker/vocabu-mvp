// Простейший извлекатель: разбиваем текст, нормализуем, считаем частоты.
// (В ChangeSet 2 можно будет улучшить и добавить стоп-слова/лемматизацию.)

export function extractWords(text: string): string[] {
  if (!text) return [];
  const tokens = (text.toLowerCase().match(/[a-zа-яё\-']{2,}/gi) ||
    []) as string[];
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w);
}
