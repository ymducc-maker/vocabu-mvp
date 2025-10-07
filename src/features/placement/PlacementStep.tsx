import React, { useMemo, useState } from "react";
import PlacementQuizAdapter from "./PlacementQuizAdapter";

/**
 * PlacementStep — Build 3 (вариант 1)
 * Переключатель Реальный/Симуляция + щадящий режим 60+.
 */

type ContextKey = "law" | "travel" | "it" | "senior";
type StyleKey = "simple" | "professional" | "academic";
type HorizonKey = 30 | 60 | 90;
type TestMode = "real" | "simulate";
type Level = "A2" | "B1" | "B2";

interface PlacementResult {
  level: Level;
  score: number;
  confidence: number;
  context: ContextKey;
  correct: number;
  total: number;
  mode: TestMode;
  comfortMode?: boolean;
}

const levelLabel: Record<Level, string> = {
  A2: "уверенный начинающий",
  B1: "средний",
  B2: "выше среднего",
};

function scoreToLevel(score: number): Level {
  if (score >= 80) return "B2";
  if (score >= 55) return "B1";
  return "A2";
}

function recommendWordsPerDay(level: Level, horizon: HorizonKey, isSenior: boolean): number | [number, number] {
  if (isSenior) return [5, 7];
  const base = level === "A2" ? 8 : level === "B1" ? 10 : 12;
  const adj = horizon === 30 ? 1.2 : horizon === 60 ? 1.0 : 0.9;
  return Math.round(base * adj);
}

function simulate(total: number): { score: number; correct: number; confidence: number } {
  const correct = Math.max(6, Math.min(total, Math.floor(total * (0.6 + Math.random() * 0.2))));
  const score = Math.round((correct / total) * 100);
  const confidence = Math.min(0.95, 0.7 + Math.random() * 0.25);
  return { score, correct, confidence };
}

const Box: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`rounded-2xl border p-3 md:p-4 bg-white ${className || ""}`}>
    {title && <div className="mb-2 text-sm font-semibold text-gray-800">{title}</div>}
    {children}
  </div>
);

const Chip: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={[
      "rounded-full border px-3 py-1.5 text-sm",
      active ? "bg-blue-50 border-blue-400 text-blue-800 font-medium" : "hover:bg-gray-50",
    ].join(" ")}
  >
    {children}
  </button>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-1 text-sm text-gray-600">{children}</div>
);

const PlacementStep: React.FC = () => {
  const [context, setContext] = useState<ContextKey>("law");
  const [style, setStyle] = useState<StyleKey>("simple");
  const [horizon, setHorizon] = useState<HorizonKey>(90);

  const [mode, setMode] = useState<TestMode>("real");
  const isSenior = context === "senior";
  const [comfortMode, setComfortMode] = useState<boolean>(false);

  const [result, setResult] = useState<PlacementResult | null>(null);
  const [showReport, setShowReport] = useState<boolean>(true);

  const [planName, setPlanName] = useState("");
  const [wordsPerDay, setWordsPerDay] = useState<number>(7);
  const [userText, setUserText] = useState("");
  const [useUserText, setUseUserText] = useState(false);

  const totalQuestions = isSenior && comfortMode ? 10 : 15;

  const recommendation = useMemo(() => {
    if (!result) return isSenior ? [5, 7] : 7;
    return recommendWordsPerDay(result.level, horizon, isSenior);
  }, [result, horizon, isSenior]);

  const [quizOpen, setQuizOpen] = useState(false);

  const startTest = () => {
    if (mode === "simulate") {
      const s = simulate(totalQuestions);
      const level = scoreToLevel(s.score);
      setResult({
        level,
        score: s.score,
        confidence: s.confidence,
        context,
        correct: s.correct,
        total: totalQuestions,
        mode,
        comfortMode,
      });
      setShowReport(true);
      setWordsPerDay(isSenior ? 6 : (Array.isArray(recommendation) ? 8 : Number(recommendation)));
      return;
    }
    setShowReport(false);
    setResult(null);
    setQuizOpen(true);
  };

  const handleDone = (payload: { score: number; confidence?: number }) => {
    const level = scoreToLevel(payload.score);
    const correct = Math.round((payload.score / 100) * totalQuestions);
    const confidence = payload.confidence ?? (isSenior ? 0.88 : 0.8);
    const r: PlacementResult = {
      level,
      score: payload.score,
      confidence: Math.min(0.98, Math.max(0.5, confidence)),
      context,
      correct,
      total: totalQuestions,
      mode: "real",
      comfortMode,
    };
    setResult(r);
    setShowReport(true);
    setQuizOpen(false);
    const rec = recommendWordsPerDay(level, horizon, isSenior);
    setWordsPerDay(Array.isArray(rec) ? Math.round((rec[0] + rec[1]) / 2) : rec);
  };

  const acceptWords = () => {
    alert("Рекомендация применена к плану: " + wordsPerDay + " слов/день");
  };

  const makePlan = () => {
    alert("План сформирован (демо).\n" + JSON.stringify({
      context, style, horizon, planName, wordsPerDay, useUserText, userTextLen: userText.length, mode, comfortMode
    }, null, 2));
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <h1 className="text-xl md:text-2xl font-semibold">Настройте цели и план</h1>

      <Box>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Контекст</Label>
            <div className="flex flex-wrap gap-2">
              <Chip active={context === "law"} onClick={() => { setContext("law"); setComfortMode(false); }}>Право</Chip>
              <Chip active={context === "travel"} onClick={() => { setContext("travel"); setComfortMode(false); }}>Туризм</Chip>
              <Chip active={context === "it"} onClick={() => { setContext("it"); setComfortMode(false); }}>IT</Chip>
              <Chip active={context === "senior"} onClick={() => { setContext("senior"); setComfortMode(true); }}>60+</Chip>
            </div>
          </div>

          <div>
            <Label>Стиль языка</Label>
            <div className="flex flex-wrap gap-2">
              <Chip active={style === "simple"} onClick={() => setStyle("simple")}>Простой</Chip>
              <Chip active={style === "professional"} onClick={() => setStyle("professional")}>Профессиональный</Chip>
              <Chip active={style === "academic"} onClick={() => setStyle("academic")}>Академический</Chip>
            </div>
          </div>

          <div>
            <Label>Срок</Label>
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value) as HorizonKey)}
            >
              <option value={30}>30 дней</option>
              <option value={60}>60 дней</option>
              <option value={90}>90 дней</option>
            </select>
          </div>
        </div>
      </Box>

      <Box title="Мини-тест уровня — Право">
        {result && showReport ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm">
                Уровень: <b>{result.level}</b> · уверенность: <b>{Math.round(result.confidence * 100)}%</b>
              </span>
              <button className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50" onClick={() => { setResult(null); }}>
                Сбросить
              </button>
              <button className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50" onClick={() => setShowReport(false)}>
                Скрыть отчёт
              </button>
              {result.mode === "simulate" && (
                <span className="rounded-lg border px-2 py-1 text-xs text-gray-600">Режим: симуляция</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Box>
                <div className="text-xs text-gray-600">Уровень</div>
                <div className="text-base font-semibold">{result.level}</div>
                <div className="text-xs text-gray-500">{levelLabel[result.level]}</div>
              </Box>
              <Box>
                <div className="text-xs text-gray-600">Результаты мини-теста</div>
                <div className="text-sm">Уровень: <b>{result.level}</b></div>
                <div className="text-sm">Уверенность: <b>{Math.round(result.confidence * 100)}%</b></div>
                <div className="text-sm">Контекст: <b>{result.context}</b></div>
              </Box>
              <Box>
                <div className="text-xs text-gray-600">Верно</div>
                <div className="text-base font-semibold">{result.correct} / {result.total}</div>
                <div className="text-xs text-gray-500">Точность: {result.score}%</div>
              </Box>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-800 leading-relaxed">
              Сбалансированная лексика и грамматика; добавим устойчивые выражения. Умеренная длина примеров, больше коллокаций. В заданиях — подстановки и выбор правильной формы.
            </div>

            <div className="text-sm">
              Как это повлияло на план: рекомендация{" "}
              {Array.isArray(recommendation)
                ? <b>≈ {recommendation[0]}–{recommendation[1]} / день</b>
                : <b>≈ {recommendation} / день</b>}{" "}
              {isSenior && "(диапазон 5–7 для 60+)"}.
            </div>
          </div>
        ) : quizOpen ? (
          <div className="space-y-3">
            {isSenior && (
              <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                Это не экзамен, отвечайте спокойно. Система подберёт комфортный темп.
              </div>
            )}
            <PlacementQuizAdapter
              context={context}
              totalQuestions={totalQuestions}
              comfortMode={comfortMode}
              onDone={handleDone}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-gray-700">Режим:</div>
              <div className="inline-flex rounded-full border p-1">
                <button
                  onClick={() => setMode("real")}
                  className={`px-3 py-1 rounded-full text-sm ${mode === "real" ? "bg-blue-600 text-white" : ""}`}
                >
                  Реальный
                </button>
                <button
                  onClick={() => setMode("simulate")}
                  className={`px-3 py-1 rounded-full text-sm ${mode === "simulate" ? "bg-blue-600 text-white" : ""}`}
                >
                  Симуляция
                </button>
              </div>
              {isSenior && (
                <label className="ml-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={comfortMode} onChange={(e) => setComfortMode(e.target.checked)} />
                  Щадящий режим (60+)
                </label>
              )}
            </div>
            <div className="text-xs text-gray-600">
              {mode === "real"
                ? `Будет показано ${totalQuestions} вопросов. Это не экзамен; отвечайте спокойно.`
                : "Будет сгенерирован реалистичный результат для демо (уровень, точность, рекомендации)."}
            </div>
            <div className="flex">
              <button className="mt-1 rounded-2xl bg-black px-4 py-2 text-white" onClick={startTest}>
                Пройти тест
              </button>
            </div>
          </div>
        )}
      </Box>

      <Box>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <Label>Слов в день</Label>
            <input
              type="number"
              value={wordsPerDay}
              onChange={(e) => setWordsPerDay(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-xl border px-3 py-2"
            />
            <div className="mt-1 text-xs text-gray-600">
              ≈ в неделю: <b>{wordsPerDay * 7}</b> · всего: <b>{wordsPerDay * horizon}</b>
            </div>
          </div>
          <div>
            <Label>Рекомендация</Label>
            <div className="flex items-center gap-2">
              <div className="rounded-xl border px-3 py-2 text-sm">
                {Array.isArray(recommendation)
                  ? <>{recommendation[0]}–{recommendation[1]} <span className="text-gray-500">/день</span></>
                  : <>{recommendation} <span className="text-gray-500">/день</span></>}
              </div>
              <button onClick={acceptWords} className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">
                Принять
              </button>
            </div>
          </div>
        </div>
      </Box>

      <Box>
        <Label>Название плана (опц.)</Label>
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Напр.: Туризм за 30 дней"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
        />
        <div className="mt-1 text-xs text-gray-500">Для удобства на вкладке «Прогресс». На расчёт не влияет.</div>
      </Box>

      <Box title="Пользовательский текст (опционально)">
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          rows={5}
          className="w-full rounded-xl border p-3"
          placeholder="Вставьте список слов или абзац по выбранному контексту."
        />
        <div className="mt-2 flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={useUserText} onChange={(e) => setUseUserText(e.target.checked)} />
            Использовать при формировании пакета
          </label>
          <div className="text-xs text-gray-500">
            Символов: {userText.length}; слов: {userText.trim() ? userText.trim().split(/\s+/).length : 0}
          </div>
        </div>
      </Box>

      <div className="flex flex-wrap gap-2">
        <button className="rounded-2xl bg-blue-600 px-4 py-2 text-white" onClick={makePlan}>
          Сформировать план
        </button>
        <button className="rounded-2xl border px-4 py-2 hover:bg-gray-50">Далее: Обучение</button>
      </div>

      <div className="text-sm text-gray-700">
        <b>Ваш план</b><br />
        Всего слов: <b>{wordsPerDay * (horizon / 1)}</b>, в неделю: <b>{wordsPerDay * 7}</b>, в день: <b>{wordsPerDay}</b>. Набор на сегодня: <b>{wordsPerDay}</b>
      </div>
    </div>
  );
};

export default PlacementStep;
