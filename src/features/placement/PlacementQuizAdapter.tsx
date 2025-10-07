import React, { useState } from "react";

/**
 * PlacementQuizAdapter — адаптер мини-теста уровня.
 * Используется в PlacementStep (Build 3): Law / Travel / IT / Senior контексты.
 * Возвращает результат { level, confidence } в родительский компонент.
 */

type Question = {
  id: number;
  text: string;
  options: string[];
  answer: string;
  weight: number; // сложность 1–3
};

interface PlacementQuizAdapterProps {
  contextKey: string;
  onComplete: (result: { level: string; confidence: number }) => void;
}

const questionBank: Record<string, Question[]> = {
  law: [
    { id: 1, text: "Choose the correct word: The judge ___ the verdict.", options: ["gave", "take", "makes"], answer: "gave", weight: 2 },
    { id: 2, text: "Translate: 'Court hearing'", options: ["судебное заседание", "слушание музыки", "высший суд"], answer: "судебное заседание", weight: 1 },
    { id: 3, text: "Which term means 'evidence'?", options: ["доказательство", "наказание", "преступление"], answer: "доказательство", weight: 3 },
  ],
  travel: [
    { id: 1, text: "Choose: I ___ a ticket to Paris.", options: ["buyed", "bought", "buy"], answer: "bought", weight: 1 },
    { id: 2, text: "Translate: 'boarding pass'", options: ["посадочный талон", "виза", "багаж"], answer: "посадочный талон", weight: 2 },
    { id: 3, text: "Question: 'currency exchange' means…", options: ["обмен валюты", "таможня", "страховка"], answer: "обмен валюты", weight: 2 },
  ],
  it: [
    { id: 1, text: "Choose: 'frontend' refers to…", options: ["UI", "database", "server"], answer: "UI", weight: 1 },
    { id: 2, text: "Translate: 'debugging'", options: ["поиск ошибок", "настройка сети", "тестирование пользователей"], answer: "поиск ошибок", weight: 3 },
    { id: 3, text: "Select: JS is a ___ language.", options: ["compiled", "interpreted", "hardware"], answer: "interpreted", weight: 2 },
  ],
  senior: [
    { id: 1, text: "Translate: 'blood pressure'", options: ["кровяное давление", "пульс", "температура"], answer: "кровяное давление", weight: 1 },
    { id: 2, text: "Choose: The doctor ___ me a new medicine.", options: ["prescribed", "describe", "writing"], answer: "prescribed", weight: 2 },
    { id: 3, text: "Translate: 'pharmacy'", options: ["аптека", "больница", "лекарство"], answer: "аптека", weight: 2 },
  ],
};

export default function PlacementQuizAdapter({
  contextKey,
  onComplete,
}: PlacementQuizAdapterProps) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const questions = questionBank[contextKey] || [];

  const handleAnswer = (choice: string) => {
    const q = questions[step];
    const isCorrect = q.answer === choice;
    const delta = isCorrect ? q.weight : 0;
    setScore((prev) => prev + delta);
    const next = step + 1;

    if (next < questions.length) {
      setStep(next);
    } else {
      const maxScore = questions.reduce((a, b) => a + b.weight, 0);
      const ratio = score / maxScore;
      const level =
        ratio > 0.8 ? "B2" : ratio > 0.5 ? "B1" : "A2";
      const confidence = Math.round(ratio * 100);
      onComplete({ level, confidence });
    }
  };

  if (step >= questions.length) {
    return null;
  }

  const q = questions[step];

  return (
    <div className="p-4 rounded-2xl border bg-gray-50">
      <p className="text-base mb-2">
        <b>Question {step + 1} / {questions.length}:</b> {q.text}
      </p>
      <div className="flex flex-col gap-2">
        {q.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            className="rounded-lg border px-3 py-1 text-left hover:bg-blue-50"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
