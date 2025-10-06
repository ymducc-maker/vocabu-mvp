import React, { useState } from 'react';

type ContextKey = 'law' | 'travel' | 'it' | 'senior';
type StyleKey = 'simple' | 'professional' | 'academic';
type HorizonKey = 30 | 60 | 90;
type TestMode = 'real' | 'simulate';

interface PlacementResult {
  level: 'A2' | 'B1' | 'B2';
  score: number; // 0..100
  confidence: number; // 0..1
  context: ContextKey;
  horizon: HorizonKey;
  wordsPerDay: number | [number, number];
  mode: TestMode;
  comfortMode?: boolean;
}

function scoreToLevel(score: number): PlacementResult['level'] {
  if (score >= 80) return 'B2';
  if (score >= 55) return 'B1';
  return 'A2';
}

function recommendWordsPerDay(
  level: PlacementResult['level'],
  horizon: HorizonKey,
  isSenior: boolean
): number | [number, number] {
  if (isSenior) return [5, 7];
  const base = level === 'A2' ? 8 : level === 'B1' ? 10 : 12;
  const adj = horizon === 30 ? 1.2 : horizon === 60 ? 1.0 : 0.9;
  return Math.round(base * adj);
}

function simulateResult(
  context: ContextKey,
  horizon: HorizonKey,
  comfortMode: boolean
): PlacementResult {
  const score = Math.floor(55 + Math.random() * 30); // 55..85
  const confidence = Math.min(0.95, 0.6 + Math.random() * 0.35);
  const level = scoreToLevel(score);
  const wpd = recommendWordsPerDay(level, horizon, context === 'senior');
  return {
    level,
    score,
    confidence,
    context,
    horizon,
    wordsPerDay: wpd,
    mode: 'simulate',
    comfortMode,
  };
}

const Section: React.FC<{
  title: string;
  note?: string;
  children: React.ReactNode;
}> = ({ title, note, children }) => (
  <div className="mb-6 rounded-2xl border p-4 shadow-sm">
    <div className="mb-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {note && <p className="mt-1 text-sm text-gray-600">{note}</p>}
    </div>
    {children}
  </div>
);

const PlacementStep: React.FC = () => {
  // базовые параметры плана
  const [context, setContext] = useState<ContextKey>('law');
  const [style, setStyle] = useState<StyleKey>('simple');
  const [horizon, setHorizon] = useState<HorizonKey>(60);
  const [planName, setPlanName] = useState<string>('');

  // пользовательский текст
  const [useUserText, setUseUserText] = useState<boolean>(false);
  const [userText, setUserText] = useState<string>('');

  // новые флаги
  const [mode, setMode] = useState<TestMode>('real'); // по умолчанию — реальный тест
  const isSenior = context === 'senior';
  const [comfortMode, setComfortMode] = useState<boolean>(isSenior); // для 60+ включен по умолчанию

  // флоу теста
  const [phase, setPhase] = useState<'config' | 'quiz' | 'result'>('config');
  const [result, setResult] = useState<PlacementResult | null>(null);

  const seniorIntro = isSenior ? (
    <div className="mt-2 rounded-xl bg-gray-50 p-3 text-sm leading-relaxed">
      Этот короткий тест поможет подобрать темп и объём, чтобы занятия были
      комфортными и полезными для памяти. Это не экзамен — отвечайте спокойно.
    </div>
  ) : null;

  const startTest = () => {
    if (mode === 'simulate') {
      const r = simulateResult(context, horizon, comfortMode);
      setResult(r);
      setPhase('result');
      return;
    }
    setPhase('quiz'); // реальный режим
  };

  const completeTest = (payload: { score: number; confidence?: number }) => {
    const confidence = payload.confidence ?? (isSenior ? 0.85 : 0.75);
    const level = scoreToLevel(payload.score);
    const wpd = recommendWordsPerDay(level, horizon, isSenior);
    const r: PlacementResult = {
      level,
      score: payload.score,
      confidence: Math.min(0.98, Math.max(0.5, confidence)),
      context,
      horizon,
      wordsPerDay: wpd,
      mode: 'real',
      comfortMode,
    };
    setResult(r);
    setPhase('result');
  };

  const applyPlan = () => {
    // интегрируйте с вашим buildPackage/state-менеджером
    // buildPackage({ result, userText, useUserText, planName, context, style, horizon })
    alert('План применён. Рекомендации сохранены в текущий план обучения.');
  };

  const resetAll = () => {
    setPhase('config');
    setResult(null);
  };

  if (phase === 'quiz') {
    const total = isSenior && comfortMode ? 10 : 15;
    return (
      <div className="p-4">
        <h2 className="mb-2 text-xl font-semibold">
          Мини-тест ({total} вопросов)
        </h2>
        {isSenior && (
          <p className="mb-4 text-sm text-gray-600">
            Не спешите. Это не экзамен — ответы нужны, чтобы система подобрала
            подходящий темп.
          </p>
        )}
        <PlacementQuizAdapter
          context={context}
          totalQuestions={total}
          comfortMode={comfortMode}
          onDone={completeTest}
        />
      </div>
    );
  }

  if (phase === 'result' && result) {
    const readable =
      result.level === 'A2'
        ? 'уверенный начинающий'
        : result.level === 'B1'
        ? 'средний'
        : 'выше среднего';
    const rec = Array.isArray(result.wordsPerDay)
      ? `${result.wordsPerDay[0]}–${result.wordsPerDay[1]} слов/день`
      : `${result.wordsPerDay} слов/день`;

    return (
      <div className="space-y-6 p-4">
        <Section
          title="Результат мини-теста"
          note={
            result.mode === 'simulate'
              ? 'Режим: симуляция (для демо)'
              : undefined
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-sm text-gray-500">Уровень</div>
              <div className="text-lg font-semibold">
                {result.level} · {readable}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-sm text-gray-500">Точность ответов</div>
              <div className="text-lg font-semibold">{result.score}%</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-sm text-gray-500">Доверие оценки</div>
              <div className="text-lg font-semibold">
                {Math.round(result.confidence * 100)}%
              </div>
            </div>
          </div>
        </Section>

        <Section title="Рекомендация к плану">
          <p className="text-base">
            Рекомендуемый темп: <span className="font-semibold">{rec}</span>.
          </p>
          {isSenior ? (
            <p className="mt-2 text-sm text-gray-700">
              Регулярность важнее скорости. Можно увеличить объём позже — когда
              почувствуете уверенность.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-2xl border px-4 py-2 hover:bg-gray-50"
              onClick={resetAll}
            >
              Сбросить
            </button>
            <button
              className="rounded-2xl bg-black px-4 py-2 text-white"
              onClick={applyPlan}
            >
              Принять план
            </button>
          </div>
        </Section>
      </div>
    );
  }

  // phase === "config"
  return (
    <div className="space-y-6 p-4">
      <Section title="Выбор параметров">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-600">Контекст</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['law', 'travel', 'it', 'senior'] as ContextKey[]).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setContext(c);
                    if (c === 'senior') setComfortMode(true);
                  }}
                  className={`rounded-2xl border px-4 py-2 hover:bg-gray-50 ${
                    context === c ? 'border-blue-300 bg-blue-50' : ''
                  }`}
                >
                  {c === 'law'
                    ? 'Право'
                    : c === 'travel'
                    ? 'Туризм'
                    : c === 'it'
                    ? 'IT'
                    : '60+'}
                </button>
              ))}
            </div>
            {seniorIntro}
          </div>

          <div>
            <label className="text-sm text-gray-600">Стиль</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['simple', 'professional', 'academic'] as StyleKey[]).map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`rounded-2xl border px-4 py-2 hover:bg-gray-50 ${
                      style === s ? 'border-blue-300 bg-blue-50' : ''
                    }`}
                  >
                    {s === 'simple'
                      ? 'Простой'
                      : s === 'professional'
                      ? 'Профессиональный'
                      : 'Академический'}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Горизонт</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[30, 60, 90].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h as HorizonKey)}
                  className={`rounded-2xl border px-4 py-2 hover:bg-gray-50 ${
                    horizon === h ? 'border-blue-300 bg-blue-50' : ''
                  }`}
                >
                  {h} дней
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Название плана (опц.)
            </label>
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="mt-2 w-full rounded-xl border px-3 py-2"
              placeholder="Например: Путешествие весной"
            />
          </div>
        </div>
      </Section>

      <Section
        title="Пользовательский текст (опционально)"
        note="Можно вставить свой текст — система выделит слова и добавит их в план."
      >
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          rows={4}
          className="w-full rounded-xl border p-3"
          placeholder="Вставьте сюда абзац текста..."
        />
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useUserText}
            onChange={(e) => setUseUserText(e.target.checked)}
          />
          Использовать слова из текста при формировании плана
        </label>
      </Section>

      <Section title="Режим мини-теста">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600">Режим:</span>
            <div className="inline-flex rounded-2xl border p-1">
              <button
                onClick={() => setMode('real')}
                className={`rounded-2xl px-3 py-1 ${
                  mode === 'real' ? 'bg-blue-600 text-white' : ''
                }`}
              >
                Реальный
              </button>
              <button
                onClick={() => setMode('simulate')}
                className={`rounded-2xl px-3 py-1 ${
                  mode === 'simulate' ? 'bg-blue-600 text-white' : ''
                }`}
              >
                Симуляция
              </button>
            </div>
          </div>

          {isSenior && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={comfortMode}
                onChange={(e) => setComfortMode(e.target.checked)}
              />
              ✅ Щадящий режим (меньше вопросов, мягкие подсказки)
            </label>
          )}

          <div className="text-sm text-gray-600">
            {mode === 'real'
              ? 'Будет показано 15 вопросов (для 60+ в щадящем — 10). Это не экзамен; отвечайте спокойно.'
              : 'Будет сгенерирован реалистичный результат для демо (уровень, точность, рекомендации).'}
          </div>

          <div>
            <button
              onClick={startTest}
              className="mt-2 rounded-2xl bg-black px-4 py-2 text-white"
            >
              Пройти тест
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default PlacementStep;

// Адаптер викторины (минимально необходимый API)
export const PlacementQuizAdapter: React.FC<{
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
