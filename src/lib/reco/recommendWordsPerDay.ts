// src/lib/reco/recommendWordsPerDay.ts — ПОЛНАЯ ЗАМЕНА
import { RECO_BASE_BY_DAYS } from '../../config/domain';
import type { PlacementResult, StyleId } from '../../types';

type Reco = {
  min: number;
  max: number;
  suggested: number;
  range: { min: number; max: number }; // нужно для текущего UI
};

export function recommendWordsPerDay(
  horizonDays: number,
  style: StyleId,
  placement: PlacementResult | null
): Reco {
  // База на 30/60/90 дней; если нет — безопасные значения
  const base = RECO_BASE_BY_DAYS[horizonDays] ?? {
    min: 6,
    max: 10,
    suggested: 8,
  };

  // Поправки по стилю
  let fStyle = 1;
  if (style === 'professional') fStyle = 0.9;
  if (style === 'academic') fStyle = 0.85;

  // Поправки по уровню
  let fLevel = 1;
  if (placement?.level === 'A2') fLevel = 0.85;
  if (placement?.level === 'B2') fLevel = 1.05;

  const clamp = (n: number) => Math.max(3, Math.min(30, Math.round(n)));
  const apply = (n: number) => clamp(n * fStyle * fLevel);

  const min = apply(base.min);
  const max = apply(base.max);
  const suggested = apply(base.suggested);

  return { min, max, suggested, range: { min, max } };
}
