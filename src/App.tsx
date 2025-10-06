import React, { useEffect, useMemo, useState } from 'react';

/**
 * Vocabu — Single-file SPA (Sidebar v2)
 * Шаги: 1) План/Плейсмент  2) Обучение  3) Повторение (SRS)  4) Прогресс
 * Включает: ErrorBoundary, локальное сохранение шага, мягкие гварды от NaN/пустых состояний.
 *
 * ВАЖНО: Этот файл самодостаточен и корректно подключает:
 *  - features/placement/PlacementStep (Новый экран)
 *  - features/learn/ExercisesAdapter
 *  - features/srs/SRSDeckAdapter
 *  - features/placement/ResultsPanel (временный экран Прогресса)
 */

// ===== Types =====
type Step = 1 | 2 | 3 | 4;

// ===== Versioned localStorage (минимально необходимое) =====
const LS_KEY = 'vocabu.app.state';
const APP_STATE_VERSION = 3;

type PersistedAppState = {
  v: number;
  step: Step;
};

function loadState(): PersistedAppState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAppState;
    if (!parsed || typeof parsed.v !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(next: PersistedAppState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

// ===== Error Boundary =====
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }
  static getDerivedStateFromError(err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
        ? err
        : 'Unknown error';
    return { hasError: true, message: msg };
  }
  componentDidCatch(error: unknown) {
    // здесь можно добавить логирование в аналитику
    console.error('App crashed:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-2xl p-6">
          <div className="rounded-2xl border p-6 shadow-sm">
            <h1 className="mb-2 text-2xl font-semibold">Что-то пошло не так</h1>
            <p className="text-sm text-gray-700">
              Приложение перехватило ошибку и безопасно остановило экран.
              Попробуйте обновить страницу. Если ошибка повторяется — сообщите в
              чат.
            </p>
            {this.state.message && (
              <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                Детали: {this.state.message}
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ===== Screens (подключаем существующие модули) =====
import PlacementStep from './features/placement/PlacementStep';
import LearnStep from './features/learn/ExercisesAdapter';
import ReviewStep from './features/srs/SRSDeckAdapter';
import ProgressStep from './features/placement/ResultsPanel';

// ===== App =====
const App: React.FC = () => {
  // step: восстановление из localStorage c версионированием
  const initialStep: Step = useMemo(() => {
    const persisted = loadState();
    if (!persisted || persisted.v !== APP_STATE_VERSION) return 1;
    // гвард на странные значения
    const s = persisted.step;
    return s === 1 || s === 2 || s === 3 || s === 4 ? s : 1;
  }, []);

  const [step, setStep] = useState<Step>(initialStep);

  useEffect(() => {
    saveState({ v: APP_STATE_VERSION, step });
  }, [step]);

  // Горячие клавиши для переключения шагов (1–4)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === '1') setStep(1);
      if (e.key === '2') setStep(2);
      if (e.key === '3') setStep(3);
      if (e.key === '4') setStep(4);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-white text-gray-900">
        {/* Top header (лаконично) */}
        <header className="border-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Logo />
              <div className="text-lg font-semibold">Vocabu</div>
              <div className="ml-2 rounded-full border px-2 py-0.5 text-xs text-gray-600">
                MVP · Build 3
              </div>
            </div>
            <div className="text-xs text-gray-500">
              App v{APP_STATE_VERSION} · Local state with guards
            </div>
          </div>
        </header>

        {/* Main */}
        <div className="mx-auto flex max-w-6xl gap-6 p-4">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <nav className="rounded-2xl border p-3 shadow-sm">
              <div className="mb-3 text-sm font-medium text-gray-700">
                Навигация
              </div>
              <div className="flex flex-col gap-2">
                <StepButton active={step === 1} onClick={() => setStep(1)}>
                  1. План
                </StepButton>
                <StepButton active={step === 2} onClick={() => setStep(2)}>
                  2. Обучение
                </StepButton>
                <StepButton active={step === 3} onClick={() => setStep(3)}>
                  3. Повторение
                </StepButton>
                <StepButton active={step === 4} onClick={() => setStep(4)}>
                  4. Прогресс
                </StepButton>
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                Подсказки:
                <ul className="mt-1 list-disc pl-4">
                  <li>Переключение по шагам: клавиши 1–4</li>
                  <li>Ошибки безопасно перехватываются</li>
                </ul>
              </div>
            </nav>
          </aside>

          {/* Workspace */}
          <main className="flex-1">
            <div className="rounded-2xl border p-4 shadow-sm">
              {step === 1 && <PlacementStep />}
              {step === 2 && <LearnStep />}
              {step === 3 && <ReviewStep />}
              {step === 4 && <ProgressStep />}
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="border-t">
          <div className="mx-auto max-w-6xl p-4 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Vocabu — Contextual Learning & SRS
          </div>
        </footer>
      </div>
    </AppErrorBoundary>
  );
};

export default App;

// ===== UI helpers =====
const StepButton: React.FC<{
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full rounded-xl border px-3 py-2 text-left transition',
        active
          ? 'border-blue-500 bg-blue-50 font-semibold'
          : 'hover:bg-gray-50',
      ].join(' ')}
    >
      {children}
    </button>
  );
};

const Logo: React.FC = () => (
  <div className="flex h-7 w-7 items-center justify-center rounded-xl border text-xs font-bold">
    V
  </div>
);
