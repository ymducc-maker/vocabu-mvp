import React, { useMemo, useState } from "react";

/**
 * PlacementQuizAdapter (Build 3)
 * Совместим с PlacementStep.tsx: принимает context, totalQuestions, comfortMode?, onDone.
 * Строит массив вопросов нужной длины из мини-банков по контекстам, считает %score и confidence.
 */

type ContextKey = "law" | "travel" | "it" | "senior";

interface Props {
  context: ContextKey;
  totalQuestions: number;         // 10 для 60+ (щадящий), 15 по умолчанию
  comfortMode?: boolean;          // для 60+: слегка повышает confidence
  onDone: (payload: { score: number; confidence?: number }) => void;
}

type Question = {
  id: string;
  text: string;
  options: string[];
  answer: string;
  weight: 1 | 2 | 3;             // сложность
};

/** Небольшие банки — мы их размножаем/перемешиваем до totalQuestions */
const BANK: Record<ContextKey, Question[]> = {
  law: [
    { id: "law-1", text: "The judge ___ the verdict.", options: ["gave", "take", "makes"], answer: "gave", weight: 2 },
    { id: "law-2", text: "Translate: 'Court hearing'", options: ["судебное заседание", "слушание музыки", "высший суд"], answer: "судебное заседание", weight: 1 },
    { id: "law-3", text: "Which term means 'evidence'?", options: ["доказательство", "наказание", "преступление"], answer: "доказательство", weight: 3 },
    { id: "law-4", text: "Choose: The contract is ___ by both parties.", options: ["signed", "sing", "signs"], answer: "signed", weight: 2 },
  ],
  travel: [
    { id: "tr-1", text: "I ___ a ticket to Paris.", options: ["buyed", "bought", "buy"], answer: "bought", weight: 1 },
    { id: "tr-2", text: "Translate: 'boarding pass'", options: ["посадочный талон", "виза", "багаж"], answer: "посадочный талон", weight: 2 },
    { id: "tr-3", text: "'currency exchange' means…", options: ["обмен валюты", "таможня", "страховка"], answer: "обмен валюты", weight: 2 },
    { id: "tr-4", text: "Choose: The flight was ___ by two hours.", options: ["delayed", "delay", "deal"], answer: "delayed", weight: 2 },
  ],
  it: [
    { id: "it-1", text: "'frontend' refers to…", options: ["UI", "database", "server"], answer: "UI", weight: 1 },
    { id: "it-2", text: "Translate: 'debugging'", options: ["поиск ошибок", "настройка сети", "юзабилити"], answer: "поиск ошибок", weight: 3 },
    { id: "it-3", text: "JS is a ___ language.", options: ["compiled", "interpreted", "hardware"], answer: "interpreted", weight: 2 },
    { id: "it-4", text: "Choose: API stands for…", options: ["Application Programming Interface", "Advanced Peripheral Interface", "App Program Instance"], answer: "Application Programming Interface", weight: 2 },
  ],
  senior: [
    { id: "sn-1", text: "Translate: 'blood pressure'", options: ["кровяное давление", "пульс", "температура"], answer: "кровяное давление", weight: 1 },
    { id: "sn-2", text: "The doctor ___ me a new medicine.", options: ["prescribed", "describe", "writing"], answer: "prescribed", weight: 2 },
    { id: "sn-3", text: "Translate: 'pharmacy'", options: ["аптека", "больница", "лекарство"], answer: "аптека", weight: 2 },
    { id: "sn-4", text: "Choose: Take this pill ___ meals.", options: ["after", "on", "under"], answer: "after", weight: 1 },
  ],
};

/** Утилиты */
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildQuestions = (ctx: ContextKey, total: number): Question[] => {
  const base = BANK[ctx] ?? BANK.law;
  const out: Question[] = [];
  while (out.length < total) {
    out.push(...shuffle(base).map((q, idx) => ({ ...q, id: `${q.id}#${out.length + idx}` })));
  }
  return shuffle(out).slice(0, total);
};

export default function PlacementQuizAdapter({
  context,
  totalQuestions,
  comfortMode,
  onDone,
}: Props) {
  const questions = useMemo(() => buildQuestions(context, totalQuestions), [context, totalQuestions]);
  const [step, setStep] = useState(0);
  const [correctWeighted, setCorrectWeighted] = useState(0);

  const maxWeighted = useMemo(
    () => questions.reduce((s, q) => s + q.weight, 0),
    [questions]
  );

  const handleAnswer = (choice: string) => {
    const q = questions[step];
    if (choice === q.answer) setCorrectWeighted((v) => v + q.weight);

    const next = step + 1;
    if (next < questions.length) {
      setStep(next);
    } else {
      const ratio = maxWeighted === 0 ? 0 : correctWeighted / maxWeighted;
      const score = Math.round(ratio * 100);
      // Для 60+ слегка повышаем confidence (щадящий режим)
      const baseConf = 0.72 + ratio * 0.2; // ~0.72–0.92
      const confidence = Math.min(0.98, Math.max(0.55, comfortMode ? baseConf + 0.06 : baseConf));
      onDone({ score, confidence });
    }
  };

  const q = questions[step];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border p-3 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">
            Вопрос {step + 1} / {questions.length}
          </div>
          <div className="text-xs text-gray-500">
            Контекст: <b>{context}</b>
          </div>
        </div>
        <div className="text-base mb-3">{q.text}</div>
        <div className="flex flex-col gap-2">
          {q.options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              className="rounded-xl border px-3 py-2 text-left hover:bg-blue-50"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Подсказка: отвечайте интуитивно, не задерживаясь — это не экзамен.
      </div>
    </div>
  );
}
