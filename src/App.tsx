import React, { useEffect, useMemo, useState } from 'react';
import PlacementStep from './features/placement/PlacementStep';
import './App.css';

/** ---------- Error Boundary ---------- */
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { err: string | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(e: any) {
    return { err: e?.message || String(e) || 'Unknown error' };
  }
  componentDidCatch(e: any) {
    console.error('App crashed:', e);
  }
  render() {
    if (this.state.err) {
      return (
        <div className="app">
          <div className="card">
            <h3>Ошибка в приложении</h3>
            <div className="muted">
              Перехватили ошибку, чтобы не показывать пустой экран.
            </div>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.err}</pre>
            <div className="buttonsRow" style={{ marginTop: 8 }}>
              <button
                className="btn"
                onClick={() => {
                  localStorage.clear();
                  location.reload();
                }}
              >
                Очистить данные и перезагрузить
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

/** ---------- Типы и ключи ---------- */
type Plan = {
  createdAt: number;
  context: string;
  style: string;
  pair: string;
  horizon: number;
  recommendation: {
    perDay: number;
    perWeek: number;
    total: number;
  };
  todaySet: Array<{
    id: string;
    term: string;
    translation: string;
    source: string;
  }>;
  pool: Array<{
    id: string;
    term: string;
    translation: string;
    source: string;
  }>;
  comfortMode?: boolean;
};

type SrsItem = {
  id: string;
  term: string;
  translation: string;
  reps: number;
  dueAt: number;
  lastGrade?: 'Again' | 'Hard' | 'Good' | 'Easy';
  source?: string;
};
type SrsHistoryRow = {
  id: string;
  grade: 'Again' | 'Hard' | 'Good' | 'Easy';
  at: number;
};

const LS = {
  PLAN: 'vocabu.plan.v1',
  SRS_QUEUE: 'vocabu.srsQueue.v1',
  SRS_HISTORY: 'vocabu.srsHistory.v1',
  UI_STEP: 'vocabu.ui.step.v1',
  PROGRESS: 'vocabu.progress.v1', // <--- новый ключ
};

type ProgressState = {
  date: string; // YYYY-MM-DD
  done: number; // сколько раз засчитано сегодня
  target: number; // дневная цель
  countedIds: string[]; // какие карточки уже учтены сегодня
};

/** ---------- Утилиты ---------- */
const safeParse = <T>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};
const readLS = <T>(k: string): T | null => {
  try {
    return safeParse<T>(localStorage.getItem(k));
  } catch {
    return null;
  }
};
const writeLS = <T>(k: string, v: T) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

const todayKey = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

function resetApp() {
  try {
    localStorage.removeItem('vocabu.placementResult.v1');
    localStorage.removeItem('vocabu.placementConfig.v1');
    localStorage.removeItem('vocabu.plan.v1');
    localStorage.removeItem('vocabu.srsQueue.v1');
    localStorage.removeItem('vocabu.srsHistory.v1');
    localStorage.removeItem('vocabu.ui.step.v1');
    localStorage.removeItem(LS.PROGRESS);
  } catch {}
  location.reload();
}

/** ---------- Прогресс: стор ---------- */
const progressStore = {
  read(): ProgressState {
    const today = todayKey();
    const raw = readLS<ProgressState>(LS.PROGRESS);
    if (!raw || raw.date !== today) {
      const fresh: ProgressState = {
        date: today,
        done: 0,
        target: 0,
        countedIds: [],
      };
      writeLS(LS.PROGRESS, fresh);
      return fresh;
    }
    return raw;
  },
  setTarget(target: number) {
    const st = this.read();
    const next = { ...st, target: Math.max(0, Math.floor(target)) || 0 };
    writeLS(LS.PROGRESS, next);
    return next;
  },
  increment(id: string) {
    const st = this.read();
    if (!id) return st;
    if (st.countedIds.includes(id)) return st; // считаем 1 раз/день на карточку
    const next: ProgressState = {
      ...st,
      done: st.done + 1,
      countedIds: [...st.countedIds, id],
    };
    writeLS(LS.PROGRESS, next);
    return next;
  },
};

/** ---------- SRS интервалы ---------- */
type Step = 'placement' | 'learn' | 'review' | 'progress';

const BASE_INTERVALS = {
  Again: 10 * 60 * 1000,
  Hard: 24 * 60 * 60 * 1000,
  Good: 3 * 24 * 60 * 60 * 1000,
  Easy: 7 * 24 * 60 * 60 * 1000,
} as const;

const COMFORT_INTERVALS = {
  Again: 15 * 60 * 1000,
  Hard: 12 * 60 * 60 * 1000,
  Good: 2 * 24 * 60 * 60 * 1000,
  Easy: 5 * 24 * 60 * 60 * 1000,
} as const;

const now = () => Date.now();

/** ---------- Вспомогательные функции ---------- */
function seedQueueFromPlan(plan: Plan | null, queue: SrsItem[]): SrsItem[] {
  if (!plan) return queue ?? [];
  if (queue && queue.length > 0) return queue;
  return (plan.todaySet ?? []).map((w) => ({
    id: w.id,
    term: w.term,
    translation: w.translation,
    reps: 0,
    dueAt: now(),
    source: w.source,
  }));
}

function useLocalStep(): [Step, (s: Step) => void] {
  const [step, setStep] = useState<Step>(
    (readLS<Step>(LS.UI_STEP) ?? 'placement') as Step
  );
  useEffect(() => writeLS(LS.UI_STEP, step), [step]);
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const d = (e as any).detail as { step?: Step };
        if (d?.step) setStep(d.step);
      } catch {}
    };
    window.addEventListener('vocabu:navigate', handler);
    return () => window.removeEventListener('vocabu:navigate', handler);
  }, []);
  return [step, setStep];
}

/** ---------- App ---------- */
function AppInner() {
  const [step, setStep] = useLocalStep();
  const [plan, setPlan] = useState<Plan | null>(() => readLS<Plan>(LS.PLAN));
  const [queue, setQueue] = useState<SrsItem[]>(() =>
    seedQueueFromPlan(
      readLS<Plan>(LS.PLAN),
      readLS<SrsItem[]>(LS.SRS_QUEUE) ?? []
    )
  );
  const [history, setHistory] = useState<SrsHistoryRow[]>(
    () => readLS<SrsHistoryRow[]>(LS.SRS_HISTORY) ?? []
  );

  // Прогресс (read + локальный стейт для отрисовки)
  const [progress, setProgress] = useState<ProgressState>(() =>
    progressStore.read()
  );

  // Следим за изменением плана извне и выставляем дневную цель
  useEffect(() => {
    const id = setInterval(() => {
      const newPlan = readLS<Plan>(LS.PLAN);
      if (!newPlan) return;
      setPlan((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(newPlan)) {
          const updatedQueue = seedQueueFromPlan(
            newPlan,
            readLS<SrsItem[]>(LS.SRS_QUEUE) ?? []
          );
          setQueue(updatedQueue);
          writeLS(LS.SRS_QUEUE, updatedQueue);

          // целевое число слов на день
          const target =
            Number(newPlan?.recommendation?.perDay) ||
            Number(newPlan?.todaySet?.length || 0);
          setProgress(progressStore.setTarget(target));
          return newPlan;
        }
        return prev;
      });
    }, 800);
    return () => clearInterval(id);
  }, []);

  // синхронизация history и queue с LS
  useEffect(() => writeLS(LS.SRS_QUEUE, queue), [queue]);
  useEffect(() => writeLS(LS.SRS_HISTORY, history), [history]);

  // при первом монтировании, если план уже есть — зафиксируем target
  useEffect(() => {
    if (!plan) return;
    const target =
      Number(plan?.recommendation?.perDay) ||
      Number(plan?.todaySet?.length || 0);
    setProgress(progressStore.setTarget(target));
  }, [plan?.createdAt]); // пересчёт при регенерации плана

  const intervals = plan?.comfortMode ? COMFORT_INTERVALS : BASE_INTERVALS;

  const due = useMemo(() => queue.filter((q) => q.dueAt <= now()), [queue]);
  const progressStats = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    return {
      todayReviews: history.filter((h) => h.at >= start).length,
      totalReviews: history.length,
      dueCount: due.length,
    };
  }, [history, due]);

  /** Инкремент прогресса дня (однократно на карточку) */
  const incrementDaily = (id: string) => {
    const next = progressStore.increment(id);
    setProgress(next);
  };

  function grade(item: SrsItem, g: NonNullable<SrsItem['lastGrade']>) {
    // сначала прогресс
    incrementDaily(item.id);

    // затем логика SRS
    const updated: SrsItem = {
      ...item,
      reps: (item.reps ?? 0) + 1,
      lastGrade: g,
      dueAt: now() + (intervals as any)[g],
    };
    setQueue((prev) => [...prev.filter((x) => x.id !== item.id), updated]);
    setHistory((prev) => [...prev, { id: item.id, grade: g, at: now() }]);
  }

  // вычисляем дневную цель на показ
  const dailyTarget =
    progress.target ||
    Number(plan?.recommendation?.perDay) ||
    Number(plan?.todaySet?.length || 0);

  return (
    <div className="app">
      <nav className="nav">
        <button
          className={`navLink ${step === 'placement' ? 'active' : ''}`}
          onClick={() => setStep('placement')}
        >
          План и Плейсмент
        </button>
        <button
          className={`navLink ${step === 'learn' ? 'active' : ''}`}
          onClick={() => setStep('learn')}
        >
          Обучение
        </button>
        <button
          className={`navLink ${step === 'review' ? 'active' : ''}`}
          onClick={() => setStep('review')}
        >
          Повторение (SRS)
          {progressStats.dueCount ? ` · ${progressStats.dueCount}` : ''}
        </button>
        <button
          className={`navLink ${step === 'progress' ? 'active' : ''}`}
          onClick={() => setStep('progress')}
        >
          Прогресс
        </button>

        <div style={{ marginLeft: 16 }} className="muted">
          Сегодня: <b>{progress.done}</b> / {dailyTarget || 0}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn"
            onClick={resetApp}
            title="Очистить данные и начать заново"
          >
            Сбросить данные
          </button>
        </div>
      </nav>

      {step === 'placement' && (
        <div className="page">
          {/* Короткая карточка с планом и целями дня */}
          {plan ? (
            <div className="card" style={{ marginBottom: 12 }}>
              <h3>Ваш текущий план</h3>
              <div className="line">
                Сегодня по плану: <b>{dailyTarget || 0}</b> слов
                <span className="muted"> · прогресс: </span>
                <b>{progress.done}</b>/{dailyTarget || 0}
              </div>
            </div>
          ) : null}
          <PlacementStep />
        </div>
      )}

      {step === 'learn' && (
        <div className="page">
          <div className="card">
            <h3>Обучение (демо)</h3>
            <div className="muted">
              Пройдите «Запоминание»: там интервалы и история.
            </div>
            <div className="buttonsRow">
              <button
                className="btn btn-secondary"
                onClick={() => setStep('review')}
              >
                Перейти к запоминанию
              </button>
              <button className="btn" onClick={() => setStep('placement')}>
                ← К плану
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="page">
          <div className="card">
            <h3>
              Запоминание (SRS v1)
              {plan?.comfortMode ? ' · мягкий темп' : ''}
            </h3>
            {!plan && (
              <div className="muted">
                План отсутствует. Сформируйте его на шаге «План и Плейсмент».
              </div>
            )}
            {plan && due.length === 0 && (
              <div className="empty">
                <div>Нет карточек к запоминанию прямо сейчас.</div>
                <div className="muted">
                  Интервалы: Again {plan?.comfortMode ? '15 мин' : '10 мин'},
                  Hard {plan?.comfortMode ? '12 ч' : '1 день'}, Good{' '}
                  {plan?.comfortMode ? '2 дня' : '3 дня'}, Easy{' '}
                  {plan?.comfortMode ? '5 дней' : '7 дней'}.
                </div>
                <div className="buttonsRow">
                  <button className="btn" onClick={() => setStep('placement')}>
                    ← К плану
                  </button>
                </div>
              </div>
            )}
            {plan && due.length > 0 && (
              <SrsSession items={due} onGrade={grade} />
            )}
          </div>
        </div>
      )}

      {step === 'progress' && (
        <div className="page">
          <div className="card">
            <h3>Прогресс (v1)</h3>
            <div className="line">
              <b>Сегодня по плану:</b> {dailyTarget || 0}
            </div>
            <div className="line">
              <b>Выполнено сегодня:</b> {progress.done} / {dailyTarget || 0}
            </div>
            <div className="line">
              <b>Сегодня повторов (всего нажатий):</b>{' '}
              {progressStats.todayReviews}
            </div>
            <div className="line">
              <b>Всего повторов:</b> {progressStats.totalReviews}
            </div>
            <div className="line">
              <b>Готово к запоминанию сейчас:</b> {progressStats.dueCount}
            </div>
            <div className="buttonsRow">
              <button
                className="btn btn-primary"
                onClick={() => setStep('review')}
              >
                Начать запоминание →
              </button>
              <button className="btn" onClick={() => setStep('placement')}>
                ← К плану
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** ---------- Встроенная SRS-сессия ---------- */
const SrsSession: React.FC<{
  items: SrsItem[];
  onGrade: (it: SrsItem, g: NonNullable<SrsItem['lastGrade']>) => void;
}> = ({ items, onGrade }) => {
  const [index, setIndex] = useState(0);
  const current = items[index];
  if (!current) return null;
  const next = () => {
    if (index < items.length - 1) setIndex(index + 1);
  };
  return (
    <div className="srs">
      <div className="srs__counter">
        Карточка {index + 1} из {items.length}
      </div>
      <div className="srs__card">
        <div className="srs__term">{current.term}</div>
        <div className="srs__translation">{current.translation}</div>
      </div>
      <div className="srs__actions">
        <button
          className="btn srs-again"
          onClick={() => {
            onGrade(current, 'Again');
            next();
          }}
        >
          Again
        </button>
        <button
          className="btn srs-hard"
          onClick={() => {
            onGrade(current, 'Hard');
            next();
          }}
        >
          Hard
        </button>
        <button
          className="btn srs-good"
          onClick={() => {
            onGrade(current, 'Good');
            next();
          }}
        >
          Good
        </button>
        <button
          className="btn srs-easy"
          onClick={() => {
            onGrade(current, 'Easy');
            next();
          }}
        >
          Easy
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <AppInner />
    </AppErrorBoundary>
  );
}
