import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PlacementQuizAdapter from './PlacementQuizAdapter';
import type { PlacementQuizResult, QuizQuestion } from './PlacementQuizAdapter';

/** localStorage keys */
const LS_KEYS = {
  placementResult: 'vocabu.placementResult.v1',
  placementConfig: 'vocabu.placementConfig.v1',
  plan: 'vocabu.plan.v1',
};

/** Справочники UI */
const CONTEXTS = [
  { id: 'law', label: 'Право' },
  { id: 'travel', label: 'Туризм' },
  { id: 'it', label: 'IT' },
  { id: 'senior', label: '60+' },
] as const;

const STYLES = [
  { id: 'simple', label: 'Простой' },
  { id: 'professional', label: 'Профессиональный' },
  { id: 'academic', label: 'Академический' },
] as const;

const HORIZONS = [
  { id: 30, label: '30 дней' },
  { id: 60, label: '60 дней' },
  { id: 90, label: '90 дней' },
] as const;

const LANGUAGE_PAIRS = [
  { id: 'en-ru', label: 'EN↔RU (MVP)' },
  { id: 'en-es', label: 'EN↔ES (после MVP)' },
] as const;

type PlacementConfig = {
  context: (typeof CONTEXTS)[number]['id'];
  style: (typeof STYLES)[number]['id'];
  horizon: (typeof HORIZONS)[number]['id'];
  pair: (typeof LANGUAGE_PAIRS)[number]['id'];
  planName?: string;
  comfortMode?: boolean; // Комфорт 60+ (только для контекста senior)
};

type PlanWord = {
  id: string;
  term: string;
  translation: string;
  source: string;
};

type Plan = {
  createdAt: number;
  context: PlacementConfig['context'];
  style: PlacementConfig['style'];
  pair: PlacementConfig['pair'];
  horizon: PlacementConfig['horizon'];
  name?: string;
  recommendation: { perDay: number; perWeek: number; total: number };
  todaySet: PlanWord[];
  pool: PlanWord[];
  comfortMode?: boolean;
};

function readLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
function writeLS<T>(key: string, val: T) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

/** Рекоммендация темпа */
function computeRecommendation(
  level: 'A2' | 'B1' | 'B2',
  horizon: number,
  comfort?: boolean
) {
  const base = level === 'A2' ? 8 : level === 'B1' ? 12 : 16;
  const factor = horizon === 30 ? 1.2 : horizon === 60 ? 1.0 : 0.85;
  let perDay = Math.max(5, Math.round(base * factor));
  if (comfort) perDay = Math.max(5, Math.min(8, perDay)); // мягкий диапазон 5–8
  return { perDay, perWeek: perDay * 7, total: perDay * horizon };
}

/** 15 уникальных вопросов на контекст — fallback-банки */
const Q = {
  law: [
    ['contract', 'договор'],
    ['judge', 'судья'],
    ['evidence', 'доказательство'],
    ['lawsuit', 'иск'],
    ['defendant', 'ответчик'],
    ['plaintiff', 'истец'],
    ['verdict', 'вердикт'],
    ['appeal', 'апелляция'],
    ['fine', 'штраф'],
    ['trial', 'судебный процесс'],
    ['witness', 'свидетель'],
    ['clause', 'пункт (договора)'],
    ['liability', 'ответственность'],
    ['settlement', 'урегулирование'],
    ['copyright', 'авторское право'],
  ],
  travel: [
    ['boarding pass', 'посадочный талон'],
    ['reservation', 'бронь'],
    ['departure', 'вылет'],
    ['arrival', 'прилет'],
    ['customs', 'таможня'],
    ['luggage', 'багаж'],
    ['gate', 'выход на посадку'],
    ['transfer', 'пересадка'],
    ['visa', 'виза'],
    ['currency exchange', 'обмен валюты'],
    ['itinerary', 'маршрут'],
    ['delayed', 'задержан'],
    ['check-in', 'регистрация'],
    ['security', 'досмотр'],
    ['terminal', 'терминал'],
  ],
  it: [
    ['deployment', 'развертывание'],
    ['middleware', 'промежуточное ПО'],
    ['version control', 'система контроля версий'],
    ['commit', 'коммит'],
    ['branch', 'ветка'],
    ['merge', 'слияние'],
    ['build', 'сборка'],
    ['dependency', 'зависимость'],
    ['endpoint', 'конечная точка'],
    ['API', 'интерфейс программирования'],
    ['database', 'база данных'],
    ['query', 'запрос'],
    ['cache', 'кэш'],
    ['latency', 'задержка'],
    ['scalability', 'масштабируемость'],
  ],
  /** Обновлённый, разнообразный набор для 60+ (не медицинский) */
  senior: [
    // 🌍 Путешествия и досуг
    ['museum', 'музей'],
    ['guide', 'экскурсовод'],
    ['reservation', 'бронь'],
    // 📱 Современные технологии
    ['smartphone', 'смартфон'],
    ['message', 'сообщение'],
    ['password', 'пароль'],
    // 🏡 Быт и повседневность
    ['grocery', 'продукты'],
    ['neighbour', 'сосед'],
    ['repair', 'ремонт'],
    // 💬 Общение и семья
    ['grandchildren', 'внуки'],
    ['celebrate', 'праздновать'],
    ['invitation', 'приглашение'],
    // 🧠 Саморазвитие и обучение
    ['memory', 'память'],
    ['course', 'курс'],
    ['language', 'язык'],
  ],
} as const;

function bankFor(context: PlacementConfig['context']): QuizQuestion[] {
  return Q[context].map(([prompt, answer], i) => ({
    id: `${context}-${i}`,
    prompt,
    answer,
    options: undefined,
    translation: answer,
    hint: undefined,
  }));
}

/** нормализуем пользовательский список */
function extractUserWords(raw: string): PlanWord[] {
  const lines = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: PlanWord[] = [];
  const seen = new Set<string>();
  lines.forEach((line, i) => {
    const parts = line.split(/\s*[-—:;|]\s+|\t/);
    const term = (parts[0] ?? '').trim();
    const tr = (parts.slice(1).join(' ') || '').trim();
    if (!term) return;
    const id = `${term.toLowerCase()}-${i}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ id, term, translation: tr, source: 'userText' });
  });
  return out;
}

/** UI кусочки */
const InfoNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="vocabu-note">{children}</div>
);
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="vocabu-section">
    <h3 className="vocabu-section__title">{title}</h3>
    <div>{children}</div>
  </section>
);

const ResultCard: React.FC<{
  result: PlacementQuizResult;
  horizon: number;
  comfort: boolean;
}> = ({ result, horizon, comfort }) => {
  const rec = computeRecommendation(result.level, horizon, comfort);
  const mistakes = result.mistakes.slice(0, 5);
  return (
    <div className="vocabu-result">
      <div className="vocabu-result__header">
        <h3>Результат мини-теста</h3>
        <span className="badge">Готово</span>
      </div>

      <div className="vocabu-result__grid">
        <div className="vocabu-result__metric">
          <div className="vocabu-result__metric-label">Уровень</div>
          <div className="vocabu-result__metric-value">{result.level}</div>
        </div>
        <div className="vocabu-result__metric">
          <div className="vocabu-result__metric-label">Уверенность</div>
          <div className="vocabu-result__metric-value">
            {(result.confidence * 100).toFixed(0)}%
          </div>
        </div>
        <div className="vocabu-result__metric">
          <div className="vocabu-result__metric-label">Счёт</div>
          <div className="vocabu-result__metric-value">
            {result.correct} / {result.total}
          </div>
        </div>
        <div className="vocabu-result__metric">
          <div className="vocabu-result__metric-label">Рекомендация</div>
          <div className="vocabu-result__metric-value">
            {rec.perDay}/день · {rec.perWeek}/нед · {rec.total}/итого
          </div>
        </div>
      </div>

      {mistakes.length > 0 && (
        <div className="vocabu-result__mistakes">
          <div className="vocabu-result__mistakes-title">Ключевые ошибки</div>
          <ul>
            {mistakes.map((m) => (
              <li key={m.id}>
                <b>{m.prompt}</b> → “{m.answer}”{' '}
                {m.user && m.user !== m.answer ? `(ваш: “${m.user}”)` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function PlacementStep() {
  const [config, setConfig] = useState<PlacementConfig>(
    () =>
      readLS<PlacementConfig>(LS_KEYS.placementConfig) ?? {
        context: 'travel',
        style: 'simple',
        horizon: 60,
        pair: 'en-ru',
        planName: '',
        comfortMode: false,
      }
  );
  const [userText, setUserText] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<PlacementQuizResult | null>(() =>
    readLS<PlacementQuizResult>(LS_KEYS.placementResult)
  );
  const [plan, setPlan] = useState<Plan | null>(() =>
    readLS<Plan>(LS_KEYS.plan)
  );

  useEffect(() => {
    writeLS(LS_KEYS.placementConfig, config);
  }, [config]);

  // следим за изменениями плана из localStorage (на всякий случай)
  useEffect(() => {
    const id = setInterval(() => {
      const p = readLS<Plan>(LS_KEYS.plan);
      setPlan((prev) =>
        JSON.stringify(prev) !== JSON.stringify(p) ? p : prev
      );
    }, 800);
    return () => clearInterval(id);
  }, []);

  const loadQ = useCallback(async () => {
    // 15 уникальных
    const base = bankFor(config.context);
    const picked = shuffle(base).slice(0, 15);
    setQuestions(picked);
  }, [config.context]);

  const onStartTest = async () => {
    await loadQ();
    setIsTesting(true);
    setResult(null);
  };

  const onTestComplete = (res: PlacementQuizResult) => {
    setResult(res);
    writeLS(LS_KEYS.placementResult, res);
    setIsTesting(false);
  };

  /** Сформировать план (из результата теста + из пользовательского списка, если есть) */
  const buildPlanCombined = useCallback(() => {
    const fromTest: PlanWord[] = result
      ? result.details.map((d, i) => ({
          id: d.id ?? `${d.prompt}-${i}`,
          term: d.prompt,
          translation: d.answer,
          source: 'placement',
        }))
      : [];
    const fromUser = extractUserWords(userText);

    if (fromTest.length === 0 && fromUser.length === 0) return null; // нечего формировать

    // Склеиваем без дублей по term+translation
    const unique: PlanWord[] = [];
    const seen = new Set<string>();
    const add = (w: PlanWord) => {
      const key = `${w.term.toLowerCase()}|${(
        w.translation || ''
      ).toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(w);
    };
    fromTest.forEach(add);
    fromUser.forEach(add);

    const rec = computeRecommendation(
      result ? result.level : 'B1',
      config.horizon,
      config.comfortMode
    );
    const todaySet = unique.slice(0, Math.min(10, unique.length));
    const newPlan: Plan = {
      createdAt: Date.now(),
      context: config.context,
      style: config.style,
      pair: config.pair,
      horizon: config.horizon,
      name: config.planName,
      recommendation: rec,
      todaySet,
      pool: unique,
      comfortMode: !!config.comfortMode,
    };
    writeLS(LS_KEYS.plan, newPlan);
    setPlan(newPlan);
    // уведомим приложение (если кто-то слушает)
    window.dispatchEvent(
      new CustomEvent('vocabu:navigate', { detail: { step: 'placement' } })
    );
    return newPlan;
  }, [config, result, userText]);

  const updateConfig = <K extends keyof PlacementConfig>(
    key: K,
    val: PlacementConfig[K]
  ) => setConfig((prev) => ({ ...prev, [key]: val }));

  const isSenior = config.context === 'senior';

  return (
    <div className="placement">
      <h2 className="placement__title">План и Плейсмент</h2>

      <Section title="Настройки плана">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <label className="label">Контекст</label>
            <div className="chips">
              {CONTEXTS.map((c) => (
                <button
                  key={c.id}
                  className={`chip ${
                    config.context === c.id ? 'chip--active' : ''
                  }`}
                  aria-pressed={config.context === c.id}
                  onClick={() => updateConfig('context', c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <label className="label mt16">Стиль</label>
            <div className="chips">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  className={`chip ${
                    config.style === s.id ? 'chip--active' : ''
                  }`}
                  aria-pressed={config.style === s.id}
                  onClick={() => updateConfig('style', s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {isSenior && (
              <div className="card" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Комфорт 60+
                </div>
                <label
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <input
                    type="checkbox"
                    checked={!!config.comfortMode}
                    onChange={(e) =>
                      updateConfig('comfortMode', e.target.checked)
                    }
                  />
                  Мягкий темп и удобство восприятия (3 варианта, подсказки,
                  мягкие интервалы)
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="label">Горизонт</label>
            <div className="chips">
              {HORIZONS.map((h) => (
                <button
                  key={h.id}
                  className={`chip ${
                    config.horizon === h.id ? 'chip--active' : ''
                  }`}
                  aria-pressed={config.horizon === h.id}
                  onClick={() => updateConfig('horizon', h.id)}
                >
                  {h.label}
                </button>
              ))}
            </div>

            <label className="label mt16">Пара языков</label>
            <div className="chips">
              {LANGUAGE_PAIRS.map((p) => (
                <button
                  key={p.id}
                  className={`chip ${
                    config.pair === p.id ? 'chip--active' : ''
                  }`}
                  aria-pressed={config.pair === p.id}
                  onClick={() => updateConfig('pair', p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {config.pair === 'en-es' && (
              <InfoNote>
                EN↔ES добавим после MVP; сейчас тест и план формируются для
                EN↔RU (это ок).
              </InfoNote>
            )}
          </div>
        </div>
      </Section>

      {!isTesting && !result && (
        <Section title="Мини-тест (15 вопросов)">
          <div className="flex-row gap8">
            <button className="btn btn-primary" onClick={onStartTest}>
              Начать тест
            </button>
            <span className="muted">
              Определим уровень и предложим темп слов в день.
            </span>
          </div>
        </Section>
      )}

      {isTesting && questions && (
        <PlacementQuizAdapter
          questions={questions}
          onComplete={onTestComplete}
          comfortMode={!!config.comfortMode && isSenior}
        />
      )}

      {!isTesting && result && (
        <ResultCard
          result={result}
          horizon={config.horizon}
          comfort={!!config.comfortMode && isSenior}
        />
      )}

      <Section title="Пользовательский текст/набор слов (опционально)">
        <div className="muted">
          Добавьте свой текст (слова по теме) или готовый список слов, которые
          следует запомнить. Формат строк: <code>term - перевод</code>,{' '}
          <code>term — перевод</code>, <code>term: перевод</code> или просто
          слово.
        </div>
        <textarea
          className="textarea"
          rows={6}
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          placeholder={`Напр.:\nairport - аэропорт\ncheck-in - регистрация\nsecurity - безопасность`}
        />
        <div className="buttonsRow" style={{ marginTop: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={buildPlanCombined}
            disabled={!result && userText.trim().length === 0}
            title={
              !result && userText.trim().length === 0
                ? 'Пройдите тест или вставьте список слов'
                : 'Сформировать план по результатам и/или списку'
            }
          >
            Сформировать план
          </button>
        </div>
      </Section>

      {/* Итог шага: карточка плана + имя + кнопка */}
      <Section title="Ваш текущий план">
        {plan ? (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="line">
              <b>Контекст:</b> {String(plan.context).toUpperCase()} ·{' '}
              <b>Пара:</b> {plan.pair}
              {plan.comfortMode ? ' · Комфорт 60+' : ''}
            </div>
            <div className="line">
              <b>Рекомендация:</b> {plan.recommendation.perDay} в день ·{' '}
              {plan.recommendation.perWeek} в неделю ·{' '}
              {plan.recommendation.total} всего
            </div>
            <div className="line">
              <b>Сегодняшний набор:</b> {plan.todaySet?.length ?? 0} слов
            </div>
          </div>
        ) : (
          <div className="muted" style={{ marginBottom: 12 }}>
            После теста и/или добавления списка слов сформируйте план, и здесь
            появится итог.
          </div>
        )}

        <label className="label">
          Введите название плана обучения (опционально, для вашего удобства)
        </label>
        <input
          className="input"
          value={config.planName ?? ''}
          onChange={(e) => updateConfig('planName', e.target.value)}
          placeholder="Напр.: Право 60 дней проф."
        />
        <div className="buttonsRow" style={{ marginTop: 8 }}>
          <button
            className="btn btn-primary"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('vocabu:navigate', {
                  detail: { step: 'review' },
                })
              )
            }
          >
            Начать запоминание →
          </button>
        </div>
      </Section>
    </div>
  );
}

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
