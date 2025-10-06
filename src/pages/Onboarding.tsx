import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();

  const [goal, setGoal] = useState<string>('');
  const [style, setStyle] = useState<string>('');
  const [weeks, setWeeks] = useState<number>(12);
  const [words, setWords] = useState<number>(0);
  const [planText, setPlanText] = useState<string>('');

  // Рекомендации по количеству слов
  const recommendations: Record<string, any> = {
    travel: {
      everyday: { light: 100, standard: 150, intense: 250 },
      academic: { light: 150, standard: 200, intense: 300 },
    },
    law: {
      academic: { light: 200, standard: 300, intense: 400 },
    },
    it: {
      everyday: { light: 300, standard: 400, intense: 600 },
      academic: { light: 400, standard: 600, intense: 800 },
    },
    '60plus': {
      simplified: { recommended: 120 },
    },
  };

  // Автоподстановка слов при изменении цели/стиля
  useEffect(() => {
    if (goal && style) {
      if (goal === '60plus' && style === 'simplified') {
        setWords(recommendations['60plus'].simplified.recommended);
      } else {
        const rec = recommendations[goal]?.[style];
        if (rec && rec.standard) {
          setWords(rec.standard); // стандарт по умолчанию
        }
      }
    }
  }, [goal, style]);

  const calculatePlan = () => {
    if (!goal || !style || weeks <= 0 || words <= 0) {
      setPlanText('');
      return;
    }
    const perWeek = Math.ceil(words / weeks);
    setPlanText(
      `Ваш план: ${words} слов (${goal}/${style}) за ${weeks} недель (≈${perWeek} слов в неделю)`
    );
  };

  const confirmAndContinue = () => {
    const data = {
      goal,
      style,
      weeks,
      words,
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('onboarding', JSON.stringify(data));
    } catch {}
    navigate('/placement');
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Онбординг: цель, стиль и срок</h1>

      {/* Цель */}
      <label className="block space-y-1">
        <span className="font-medium">Цель:</span>
        <select
          className="border rounded px-2 py-2 w-full"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        >
          <option value="">— выберите цель —</option>
          <option value="law">Law School Prep</option>
          <option value="travel">Travel</option>
          <option value="it">Работа в IT</option>
          <option value="60plus">Здоровье 60+</option>
        </select>
      </label>

      {/* Стиль */}
      <label className="block space-y-1">
        <span className="font-medium">Стиль языка:</span>
        <select
          className="border rounded px-2 py-2 w-full"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        >
          <option value="">— выберите стиль —</option>
          <option value="everyday">Everyday (разговорный)</option>
          <option value="academic">Academic (академический)</option>
          {goal === '60plus' && (
            <option value="simplified">Simplified (упрощённый)</option>
          )}
        </select>
      </label>

      {/* Срок */}
      <label className="block space-y-1">
        <span className="font-medium">Срок (в неделях):</span>
        <input
          type="number"
          className="border rounded px-2 py-2 w-full"
          value={weeks}
          onChange={(e) => setWeeks(Number(e.target.value))}
          min={4}
          max={52}
        />
      </label>

      {/* Размер словаря */}
      <label className="block space-y-1">
        <span className="font-medium">Размер словаря (слов):</span>
        <input
          type="number"
          className="border rounded px-2 py-2 w-full"
          value={words}
          onChange={(e) => setWords(Number(e.target.value))}
          min={30}
          max={1000}
        />
        {goal && style && (
          <p className="text-sm text-slate-600">
            {goal !== '60plus'
              ? `Рекомендации: Light ~${recommendations[goal][style].light}, 
                 Standard ~${recommendations[goal][style].standard}, 
                 Intense ~${recommendations[goal][style].intense}`
              : `Рекомендация: ~${recommendations['60plus'].simplified.recommended} слов (упрощённый уровень).`}
          </p>
        )}
      </label>

      {/* Рассчитать */}
      <button
        onClick={calculatePlan}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={!goal || !style || weeks <= 0 || words <= 0}
      >
        Рассчитать план
      </button>

      {planText && (
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          {planText}
        </div>
      )}

      {planText && (
        <button
          onClick={confirmAndContinue}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          Подтвердить и продолжить
        </button>
      )}
    </div>
  );
}
