import React, { Component, ReactNode, useEffect, useState } from "react";
import PlacementStep from "./features/placement/PlacementStep";

/** ─────────────────────────────────────────────────────────────────────
 *  Safe Error Boundary (не читаем error.details без проверки)
 *  ───────────────────────────────────────────────────────────────────── */
type BoundaryState = { error: unknown | null };

class SafeBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Можно логировать
    console.error("App ErrorBoundary:", error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const message =
      (error as any)?.message ??
      (typeof error === "string" ? error : "Неизвестная ошибка");
    const details = (error as any)?.details;

    return (
      <div className="p-4 md:p-6 font-[system-ui]">
        <h1 className="text-2xl font-bold mb-2">Что-то пошло не так</h1>
        <p className="mb-3 text-gray-700">
          Экран безопасно остановлен. Обновите страницу и повторите действие.
        </p>
        <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-800 mb-3">
          <b>Сообщение:</b> {String(message)}
          {details ? (
            <>
              <br />
              <b>Детали:</b> {String(details)}
            </>
          ) : null}
        </div>
        <button
          onClick={() => (window.location.href = window.location.href)}
          className="rounded-xl bg-black text-white px-4 py-2"
        >
          Обновить
        </button>
      </div>
    );
  }
}

/** ─────────────────────────────────────────────────────────────────────
 *  Простой макет с сайдбаром шагов (1–4) и горячими клавишами 1–4
 *  ───────────────────────────────────────────────────────────────────── */
type Step = 1 | 2 | 3 | 4;

const NavButton: React.FC<{
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={[
      "w-full rounded-2xl px-3 py-2 text-left border",
      active ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50",
    ].join(" ")}
  >
    {children}
  </button>
);

const PlaceholderCard: React.FC<{ title: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="rounded-2xl border p-4 bg-white">
    <div className="text-sm text-gray-600 mb-2">{title}</div>
    <div className="text-gray-800">{children}</div>
  </div>
);

function Shell() {
  const [step, setStep] = useState<Step>(1);

  // Горячие клавиши 1–4
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") setStep(1);
      if (e.key === "2") setStep(2);
      if (e.key === "3") setStep(3);
      if (e.key === "4") setStep(4);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Хедер */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <b>Vocabu</b> · <span className="text-gray-700">MVP · Build 3</span>
          </div>
          <div className="text-xs text-gray-500">
            Подсказка: переключение по шагам — клавиши <b>1–4</b>
          </div>
        </div>
      </div>

      {/* Контент с сайдбаром */}
      <div className="max-w-6xl mx-auto px-2 md:px-4 py-4 grid grid-cols-12 gap-4">
        {/* Сайдбар */}
        <aside className="col-span-12 md:col-span-3">
          <div className="space-y-2">
            <NavButton active={step === 1} onClick={() => setStep(1)}>
              1. План
            </NavButton>
            <NavButton active={step === 2} onClick={() => setStep(2)}>
              2. Обучение
            </NavButton>
            <NavButton active={step === 3} onClick={() => setStep(3)}>
              3. Повторение (SRS)
            </NavButton>
            <NavButton active={step === 4} onClick={() => setStep(4)}>
              4. Прогресс
            </NavButton>
          </div>
        </aside>

        {/* Основной экран */}
        <main className="col-span-12 md:col-span-9">
          {step === 1 && <PlacementStep />}

          {step === 2 && (
            <div className="space-y-3">
              <h1 className="text-xl md:text-2xl font-semibold">Обучение</h1>
              <PlaceholderCard title="Статус">
                Здесь будет экран упражнений/тренажёров, связанный с выбранным
                планом и контекстом.
              </PlaceholderCard>
              <div className="text-sm text-gray-600">
                Для демо оставим заглушку. После завершения плейсмента сюда
                выводятся задания по текущему уровню и контексту.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h1 className="text-xl md:text-2xl font-semibold">Повторение (SRS)</h1>
              <PlaceholderCard title="Статус">
                Экран интервальных карточек (SRS). В MVP подтянем слова из
                плана и недавних упражнений.
              </PlaceholderCard>
              <div className="text-sm text-gray-600">
                Подсказка: SRS-колода формируется из «набора на сегодня» +
                недавние ошибки.
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h1 className="text-xl md:text-2xl font-semibold">Прогресс</h1>
              <PlaceholderCard title="Панель прогресса">
                Графики и метрики: скорость набора, точность, изученные слова,
                streak. На MVP — суммарные счётчики.
              </PlaceholderCard>
              <div className="text-sm text-gray-600">
                Позже сюда подключим реальные данные плана/упражнений/SRS.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SafeBoundary>
      <Shell />
    </SafeBoundary>
  );
}
