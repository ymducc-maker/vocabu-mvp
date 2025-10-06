import React from 'react';
import type { PlacementResult, UILocale, ContextId } from '../../types';

export default function ResultsPanel({
  locale,
  contextId,
  placement,
  recoSuggested,
  recoRange,
}: {
  locale: UILocale;
  contextId: ContextId;
  placement: PlacementResult;
  recoSuggested: number;
  recoRange: { min: number; max: number };
}) {
  const t = (ru: string, en: string, es?: string) =>
    locale === 'ru' ? ru : locale === 'en' ? en : es ?? en;
  const total = placement.details?.total ?? 0;
  const correct = placement.details?.correct ?? 0;
  const percent =
    total > 0
      ? Math.round((correct / total) * 100)
      : Math.round((placement.confidence || 0) * 100);

  const level = placement.level ?? 'B1';

  const hintsRu: Record<string, string[]> = {
    A2: [
      'Сильнее базовая лексика; усложним постепенно через частые фразы по контексту.',
      'Короткие предложения и простые конструкции в заданиях.',
      'Фокус на пассивный словарь → активное употребление через подсказки.',
    ],
    B1: [
      'Сбалансированная лексика и грамматика; добавим устойчивые выражения.',
      'Умеренная длина примеров, больше коллокаций.',
      'В заданиях — подстановки и выбор правильной формы.',
    ],
    B2: [
      'Хороший запас лексики; усложним заданиями на оттенки смысла.',
      'Длиннее предложения и более формальные примеры по контексту.',
      'Добавим задания на синонимику и ложных друзей.',
    ],
  };

  const hintsEn: Record<string, string[]> = {
    A2: [
      'Stronger basic lexicon; we’ll grow via frequent phrases in your context.',
      'Short sentences and simple structures in exercises.',
      'From passive to active use with guided prompts.',
    ],
    B1: [
      'Balanced vocab/grammar; we’ll add common collocations.',
      'Medium-length examples with context focus.',
      'Exercises include cloze and form selection.',
    ],
    B2: [
      'Good lexicon; we’ll target shades of meaning.',
      'Longer, more formal examples for your context.',
      'More synonym/‘false friends’ challenges.',
    ],
  };

  const hints = locale === 'ru' ? hintsRu : hintsEn;
  const tips = hints[level] ?? hints.B1;

  return (
    <div className="p-4 rounded-2xl border bg-white space-y-3">
      <div className="text-base font-medium">
        {t(
          'Результаты мини-теста',
          'Mini-test results',
          'Resultados del mini test'
        )}
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '12px' }}
      >
        <div>
          <div className="text-gray-500 text-sm">
            {t('Уровень', 'Level', 'Nivel')}
          </div>
          <div className="text-lg font-semibold">{placement.level ?? '—'}</div>
        </div>
        <div>
          <div className="text-gray-500 text-sm">
            {t('Уверенность', 'Confidence', 'Confianza')}
          </div>
          <div className="text-lg font-semibold">
            {Math.max(0, Math.min(100, percent))}%
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-sm">
            {t('Контекст', 'Context', 'Contexto')}
          </div>
          <div className="text-lg font-semibold">{contextId}</div>
        </div>
      </div>

      {total > 0 && (
        <div className="text-sm text-gray-600">
          {t('Верно', 'Correct', 'Correctas')}: <b>{correct}</b> / {total}
        </div>
      )}

      <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
        <li>{tips[0]}</li>
        <li>{tips[1]}</li>
        <li>{tips[2]}</li>
      </ul>

      <div className="text-sm text-gray-700">
        {t(
          'Как это повлияло на план',
          'How this affected your plan',
          'Cómo afectó al plan'
        )}
        :{' '}
        {t(
          `рекомендация ≈ ${recoSuggested}/день (диапазон ${recoRange.min}–${recoRange.max})`,
          `recommendation ≈ ${recoSuggested}/day (range ${recoRange.min}–${recoRange.max})`,
          `recomendación ≈ ${recoSuggested}/día (rango ${recoRange.min}–${recoRange.max})`
        )}
      </div>
    </div>
  );
}
