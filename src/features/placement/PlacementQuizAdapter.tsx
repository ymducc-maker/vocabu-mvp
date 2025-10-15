import React, { useMemo, useState } from 'react';

export type QuizQuestion = {
  id: string;
  prompt: string; // EN слово/фраза
  answer: string; // RU перевод
  options?: string[]; // варианты (если есть)
  translation?: string;
  hint?: string;
};

export type PlacementQuizResult = {
  total: number;
  correct: number;
  confidence: number; // 0.55–0.90
  level: 'A2' | 'B1' | 'B2';
  details: Array<{
    id: string;
    prompt: string;
    answer: string;
    user?: string;
    isCorrect: boolean;
  }>;
  mistakes: Array<{
    id: string;
    prompt: string;
    answer: string;
    user?: string;
  }>;
};

function levelFromScore(
  score: number,
  total: number
): PlacementQuizResult['level'] {
  const pct = (score / total) * 100;
  if (pct >= 75) return 'B2';
  if (pct >= 50) return 'B1';
  return 'A2';
}

function confidenceFromScore(score: number, total: number): number {
  const base = 0.55;
  const span = 0.35;
  const ratio = Math.max(0, Math.min(1, score / total));
  return Math.min(0.9, base + span * ratio);
}

type Props = {
  questions: QuizQuestion[];
  onComplete: (result: PlacementQuizResult) => void;
  comfortMode?: boolean; // Комфорт 60+
};

const ChoiceButton: React.FC<{
  text: string;
  selected: boolean;
  onClick: () => void;
}> = ({ text, selected, onClick }) => (
  <button
    className={`btn choice ${selected ? 'choice--selected' : ''}`}
    onClick={onClick}
  >
    {text}
  </button>
);

export default function PlacementQuizAdapter({
  questions,
  onComplete,
  comfortMode,
}: Props) {
  const total = questions.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);

  const q = questions[index];
  const progressPct = useMemo(
    () => Math.round((index / total) * 100),
    [index, total]
  );

  if (!q)
    return (
      <div className="quiz">
        <div className="muted">Вопросов нет. Начните тест заново.</div>
      </div>
    );

  // Варианты: 4 по умолчанию, 3 — в режиме Комфорт
  const options = useMemo(() => {
    const need = comfortMode ? 3 : 4;
    const pool = new Set<string>([q.answer]);
    if (q.options && q.options.length >= need) {
      const base = shuffle(q.options).slice(0, need);
      if (!base.includes(q.answer)) base[0] = q.answer;
      return shuffle(base);
    }
    for (let i = 0; i < questions.length && pool.size < need; i++) {
      const candidate = questions[i].answer;
      if (candidate !== q.answer) pool.add(candidate);
    }
    return shuffle(Array.from(pool)).slice(0, need);
  }, [q, questions, comfortMode]);

  const selected = answers[q.id];

  const selectAnswer = (opt: string) => {
    // В любом режиме: клик по варианту = выбор (без отдельного «Подтвердить»)
    setAnswers((prev) => ({ ...prev, [q.id]: opt }));
  };

  const next = () => {
    if (!selected) return;
    if (index < total - 1) {
      setIndex(index + 1);
      setShowHint(false);
    } else {
      finish();
    }
  };

  const finish = () => {
    let correct = 0;
    const details = questions.map((qq) => {
      const user = answers[qq.id];
      const isCorrect = user === qq.answer;
      if (isCorrect) correct++;
      return {
        id: qq.id,
        prompt: qq.prompt,
        answer: qq.answer,
        user,
        isCorrect,
      };
    });
    const mistakes = details
      .filter((d) => !d.isCorrect)
      .map((d) => ({
        id: d.id,
        prompt: d.prompt,
        answer: d.answer,
        user: d.user,
      }));
    const level = levelFromScore(correct, total);
    const confidence = confidenceFromScore(correct, total);
    onComplete({ total, correct, confidence, level, details, mistakes });
  };

  return (
    <div className="quiz">
      <div className="quiz__header">
        <div className="quiz__progress">
          <div className="quiz__bar" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="quiz__counter">
          Вопрос {index + 1} / {total}
        </div>
      </div>

      <div className="quiz__card">
        <div className="quiz__prompt">
          <div
            className={`quiz__prompt-en ${
              comfortMode ? 'quiz__prompt-en--xl' : ''
            }`}
          >
            {q.prompt}
          </div>
          <div className="quiz__hint">
            {comfortMode ? (
              <>
                <button className="btn" onClick={() => setShowHint((s) => !s)}>
                  {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
                </button>
                <span style={{ marginLeft: 8 }}>
                  {showHint
                    ? q.hint ?? 'Подсказка: подумайте о базовом значении'
                    : '\u00A0'}
                </span>
              </>
            ) : q.hint ? (
              `Подсказка: ${q.hint}`
            ) : (
              '\u00A0'
            )}
          </div>
        </div>

        <div className="quiz__choices">
          {options.map((opt) => (
            <ChoiceButton
              key={opt}
              text={opt}
              selected={selected === opt}
              onClick={() => selectAnswer(opt)}
            />
          ))}
        </div>

        <div className="quiz__actions">
          <button className="btn btn-secondary" onClick={finish}>
            Завершить
          </button>
          <button
            className="btn btn-primary"
            onClick={next}
            disabled={!selected}
          >
            Далее →
          </button>
        </div>
      </div>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
