import React, { useState } from 'react';

type ContextKey = 'law' | 'travel' | 'it' | 'senior';

const PlacementQuizAdapter: React.FC<{
  context: ContextKey;
  totalQuestions?: number;
  comfortMode?: boolean;
  onDone: (r: { score: number; confidence?: number }) => void;
}> = ({ context, totalQuestions = context === 'senior' ? 10 : 15, onDone }) => {
  // Простейшая внутренняя викторина без банок вопросов (демо).
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);

  const answer = (ok: boolean) => {
    if (ok) setCorrect((v) => v + 1);
    const next = idx + 1;
    if (next >= totalQuestions) {
      const score = Math.round(
        ((ok ? correct + 1 : correct) / totalQuestions) * 100
      );
      const conf = context === 'senior' ? 0.9 : 0.8;
      onDone({ score, confidence: conf });
    } else {
      setIdx(next);
    }
  };

  const progress = Math.round((idx / totalQuestions) * 100);

  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Вопрос {idx + 1} из {totalQuestions}
        </div>
        <div className="text-sm text-gray-600">Прогресс: {progress}%</div>
      </div>
      <div className="mb-4 rounded-xl bg-gray-50 p-4">
        <div className="text-base font-medium">Выберите правильный ответ</div>
        <div className="mt-2 text-sm text-gray-700">
          (Демо-вопрос. В реальной сборке вопросы берутся из банка выбранного
          контекста.)
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => answer(true)}
          className="rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          Вариант 1 (верный)
        </button>
        <button
          onClick={() => answer(false)}
          className="rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          Вариант 2
        </button>
        <button
          onClick={() => answer(false)}
          className="rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          Вариант 3
        </button>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        {context === 'senior'
          ? 'Не спешите, можно подумать спокойно.'
          : 'Выбирайте вариант и переходите дальше.'}
      </div>
    </div>
  );
};

export default PlacementQuizAdapter;
