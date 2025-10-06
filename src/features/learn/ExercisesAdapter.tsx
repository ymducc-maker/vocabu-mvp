import React, { useMemo, useState } from 'react';
import type { Plan, UILocale } from '../../types';

type Props = {
  plan: Plan | null;
  onComplete: () => void;
  locale?: UILocale;
};

type TaskKind = 'flip' | 'mcq' | 'type';
type Task = { kind: TaskKind; word: string };

/* -------------------- Локализация -------------------- */
const LANG = {
  ru: {
    progress: 'Прогресс',
    next: 'Далее',
    finish: 'Завершить мини-сессию',
    flip_front:
      'Посмотри на слово и мысленно переведи. Нажми, чтобы открыть ответ.',
    flip_back: 'Отлично! Переходи к следующему.',
    mcq_title: 'Выберите правильное слово',
    type_title: 'Введите слово по буквам',
    check: 'Проверить',
    correct: 'Верно!',
    wrongStrict: 'Неверно. Правильный ответ:',
    trans: 'Перевод',
    maskHint: 'Подсказка по буквам',
    show_answer: 'Показать ответ',
    speakingSoon_title: '🗣️ Speaking — скоро',
    speakingSoon_text:
      'В следующем релизе добавим запись голоса и базовую оценку произношения. Сейчас — чтение и письмо, чтобы закрепить слова.',
    result_excellent: 'Отличная работа!',
    result_good: 'Хорошо! Есть, что подтянуть.',
    result_needwork: (c: number, t: number) =>
      `Закрепим слова: верно ${c} из ${t}.`,
  },
  en: {
    progress: 'Progress',
    next: 'Next',
    finish: 'Finish mini-session',
    flip_front: 'Look at the word and recall the meaning. Tap to reveal.',
    flip_back: 'Nice! Go to the next one.',
    mcq_title: 'Choose the correct word',
    type_title: 'Type the word',
    check: 'Check',
    correct: 'Correct!',
    wrongStrict: 'Incorrect. Correct answer:',
    trans: 'Meaning',
    maskHint: 'Letter hint',
    show_answer: 'Show answer',
    speakingSoon_title: '🗣️ Speaking — coming soon',
    speakingSoon_text:
      'Voice recording and basic pronunciation feedback arrive in the next release. For now: reading & typing to lock in vocabulary.',
    result_excellent: 'Excellent!',
    result_good: 'Good! There’s room to improve.',
    result_needwork: (c: number, t: number) =>
      `Let’s reinforce: correct ${c} of ${t}.`,
  },
};

/* -------------------- Подсказки по контекстам -------------------- */
const HINTS: Record<string, Record<string, { ru: string; en: string }>> = {
  travel: {
    ticket: { ru: 'билет', en: 'ticket' },
    flight: { ru: 'рейс, перелёт', en: 'flight (plane)' },
    gate: { ru: 'выход на посадку', en: 'boarding gate' },
    luggage: { ru: 'багаж', en: 'luggage' },
    passport: { ru: 'паспорт', en: 'passport' },
    visa: { ru: 'виза', en: 'visa' },
    hotel: { ru: 'отель', en: 'hotel' },
    taxi: { ru: 'такси', en: 'taxi' },
    bus: { ru: 'автобус', en: 'bus' },
    train: { ru: 'поезд', en: 'train' },
    map: { ru: 'карта', en: 'map' },
    museum: { ru: 'музей', en: 'museum' },
    beach: { ru: 'пляж', en: 'beach' },
    restaurant: { ru: 'ресторан', en: 'restaurant' },
    breakfast: { ru: 'завтрак', en: 'breakfast' },
    boarding: { ru: 'посадка', en: 'boarding' },
    delayed: { ru: 'задержан', en: 'delayed' },
  },
  law: {
    court: { ru: 'суд', en: 'court' },
    judge: { ru: 'судья', en: 'judge' },
    lawyer: { ru: 'адвокат', en: 'lawyer' },
    plaintiff: { ru: 'истец', en: 'plaintiff' },
    defendant: { ru: 'ответчик', en: 'defendant' },
    evidence: { ru: 'доказательство', en: 'evidence' },
    verdict: { ru: 'вердикт', en: 'verdict' },
    appeal: { ru: 'апелляция', en: 'appeal' },
    contract: { ru: 'договор', en: 'contract' },
    rights: { ru: 'права', en: 'rights' },
  },
  it: {
    server: { ru: 'сервер', en: 'server' },
    client: { ru: 'клиент', en: 'client' },
    database: { ru: 'база данных', en: 'database' },
    query: { ru: 'запрос', en: 'query' },
    bug: { ru: 'ошибка', en: 'bug' },
    deploy: { ru: 'выкатка', en: 'deploy' },
    cloud: { ru: 'облако', en: 'cloud' },
    repository: { ru: 'репозиторий', en: 'repository' },
    commit: { ru: 'коммит', en: 'commit' },
    branch: { ru: 'ветка', en: 'branch' },
  },
  senior: {
    clinic: { ru: 'поликлиника', en: 'clinic' },
    appointment: { ru: 'запись (на приём)', en: 'appointment' },
    insurance: { ru: 'страховка', en: 'insurance' },
    pension: { ru: 'пенсия', en: 'pension' },
    pharmacy: { ru: 'аптека', en: 'pharmacy' },
    benefits: { ru: 'льготы', en: 'benefits' },
    schedule: { ru: 'расписание', en: 'schedule' },
  },
};

/* -------------------- Вспомогалки -------------------- */
const LOG_KEY = 'vocabu_learn_log_v1';

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeTypos(word: string): string[] {
  const lower = word.toLowerCase();
  const variants = new Set<string>();
  if (lower.length >= 4) {
    const i = Math.floor(1 + Math.random() * Math.max(1, lower.length - 3));
    variants.add(
      lower.slice(0, i) + lower[i + 1] + lower[i] + lower.slice(i + 2)
    );
  }
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const j = Math.floor(Math.random() * Math.max(1, lower.length - 1));
  variants.add(
    lower.slice(0, j) +
      letters[Math.floor(Math.random() * letters.length)] +
      lower.slice(j + 1)
  );
  if (variants.size < 2) {
    const k = Math.floor(Math.random() * (lower.length + 1));
    variants.add(
      lower.slice(0, k) +
        letters[Math.floor(Math.random() * letters.length)] +
        lower.slice(k)
    );
  }
  const out = Array.from(variants).filter((v) => v !== lower);
  return out.slice(0, 2);
}

function jiggle(word: string) {
  const lower = word.toLowerCase();
  if (lower.length < 3) return lower + lower[lower.length - 1];
  const i = Math.max(1, Math.min(lower.length - 2, 2));
  return lower.slice(0, i) + lower[i + 1] + lower[i] + lower.slice(i + 2);
}

function mask(word: string) {
  if (word.length <= 2) return word;
  return `${word[0]}${'•'.repeat(Math.max(1, word.length - 2))}${
    word[word.length - 1]
  }`;
}

function getHintParts(word: string, context: string, locale: UILocale) {
  const entry = HINTS[context]?.[word.toLowerCase()];
  const trans = entry ? (locale === 'ru' ? entry.ru : entry.en) : '';
  const m = mask(word);
  return { trans, mask: m };
}

/** Запись результата: сохраняем максимальное качество за день по слову */
function logQuality(word: string, quality: 0 | 3 | 4 | 5) {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const today = todayISO();
    let data: { date: string; items: Record<string, number> } = raw
      ? JSON.parse(raw)
      : { date: today, items: {} };
    if (data.date !== today) data = { date: today, items: {} };
    const key = String(word).toLowerCase();
    const prev = data.items[key] ?? -1;
    data.items[key] = Math.max(prev, quality);
    localStorage.setItem(LOG_KEY, JSON.stringify(data));
  } catch {}
}

function resultText(locale: UILocale, correct: number, total: number) {
  const l = LANG[locale] ?? LANG.ru;
  const r = total > 0 ? correct / total : 0;
  if (r >= 0.85) return l.result_excellent;
  if (r >= 0.6) return l.result_good;
  return l.result_needwork(correct, total);
}

/* -------------------- Компонент -------------------- */
export default function ExercisesAdapter({
  plan,
  onComplete,
  locale = 'ru',
}: Props) {
  const t = LANG[locale] ?? LANG.ru;
  const context = plan?.contextId ?? 'travel';

  const words = useMemo(() => {
    const set = plan?.todaySet?.length
      ? plan!.todaySet
      : ['ticket', 'flight', 'gate', 'luggage', 'hotel', 'taxi', 'map'];
    return set.slice(0, Math.min(8, set.length));
  }, [plan]);

  const tasks: Task[] = useMemo(() => {
    const kinds: TaskKind[] = ['flip', 'mcq', 'type'];
    return words.map((w, i) => ({ word: w, kind: kinds[i % kinds.length] }));
  }, [words]);

  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const total = tasks.length;
  const task = tasks[idx];

  const next = () => {
    if (idx + 1 >= total) setDone(true);
    else setIdx((v) => v + 1);
  };
  const mark = (ok: boolean) => {
    if (ok) setCorrect((v) => v + 1);
    next();
  };

  if (!task && !done) {
    return (
      <div className="p-4 rounded-2xl border bg-white">
        <div className="text-sm">Нет заданий для этой сессии</div>
        <button
          className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white"
          onClick={onComplete}
        >
          {t.finish}
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-5 rounded-2xl border bg-white space-y-3">
        <div className="text-lg font-semibold">
          {resultText(locale || 'ru', correct, total)}
        </div>
        <div className="text-sm text-gray-700">
          Верных ответов: {correct} из {total}.
        </div>
        <button
          className="px-4 py-2 rounded-xl bg-blue-600 text-white"
          onClick={onComplete}
        >
          {t.finish}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Плашка "Speaking — скоро" с явным отступом снизу */}
      <div className="p-4 rounded-2xl border bg-white shadow-sm">
        <div className="text-sm font-medium">{t.speakingSoon_title}</div>
        <div className="text-xs text-gray-600 mt-1">{t.speakingSoon_text}</div>
      </div>

      <div className="text-xs text-gray-500">
        {t.progress}: {idx + 1}/{total}
      </div>

      {task.kind === 'flip' && (
        <FlipCard
          word={task.word}
          t={t}
          onNext={() => {
            logQuality(task.word, 3);
            next();
          }} // Flip → Hard(3)
        />
      )}

      {task.kind === 'mcq' && (
        <MCQ
          word={task.word}
          hintParts={getHintParts(task.word, context, locale || 'ru')}
          t={t}
          onAnswer={(ok) => {
            logQuality(task.word, ok ? 4 : 0);
            mark(ok);
          }} // MCQ: Good(4) / Again(0)
        />
      )}

      {task.kind === 'type' && (
        <TypeIn
          word={task.word}
          hintParts={getHintParts(task.word, context, locale || 'ru')}
          t={t}
          onAnswer={(ok) => {
            logQuality(task.word, ok ? 5 : 0);
            mark(ok);
          }} // Type: Easy(5) / Again(0)
        />
      )}
    </div>
  );
}

/* -------------------- Sub-components -------------------- */

function FlipCard({
  word,
  t,
  onNext,
}: {
  word: string;
  t: (typeof LANG)['ru'];
  onNext: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="p-4 rounded-2xl border bg-white">
      {!revealed ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">{t.flip_front}</div>
          <div className="text-2xl font-semibold">{word}</div>
          <button
            className="px-3 py-2 rounded-xl bg-blue-600 text-white"
            onClick={() => setRevealed(true)}
          >
            {t.show_answer}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-2xl font-semibold">{word}</div>
          <div className="text-sm text-gray-600">{t.flip_back}</div>
          <button className="px-3 py-2 rounded-xl border" onClick={onNext}>
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}

function MCQ({
  word,
  hintParts,
  t,
  onAnswer,
}: {
  word: string;
  hintParts: { trans: string; mask: string };
  t: (typeof LANG)['ru'];
  onAnswer: (ok: boolean) => void;
}) {
  // ≥ 3 вариантов всегда
  const base = [word.toLowerCase(), ...makeTypos(word)];
  while (base.length < 3) base.push(jiggle(word));
  const options = useMemo(() => shuffle(Array.from(new Set(base))), [word]);

  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const ok = picked === word.toLowerCase();

  return (
    <div className="p-4 rounded-2xl border bg-white space-y-3">
      <div className="text-sm font-medium">{t.mcq_title}</div>
      <div className="text-xs text-gray-600">
        {hintParts.trans && (
          <div>
            <span className="font-medium">{t.trans}:</span> {hintParts.trans}
          </div>
        )}
        <div>
          <span className="font-medium">{t.maskHint}:</span> {hintParts.mask}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-2">
        {options.map((o, i) => (
          <button
            key={i}
            onClick={() => setPicked(o)}
            className={
              'px-3 py-2 rounded-xl border text-left ' +
              (picked === o ? 'bg-blue-600 text-white' : 'bg-white')
            }
          >
            {o}
          </button>
        ))}
      </div>

      {!checked ? (
        <button
          disabled={!picked}
          className={
            'px-3 py-2 rounded-xl ' +
            (!picked ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white')
          }
          onClick={() => setChecked(true)}
        >
          {t.check}
        </button>
      ) : (
        <div className="space-y-3">
          <div
            className={'text-sm ' + (ok ? 'text-green-700' : 'text-rose-700')}
          >
            {ok ? t.correct : `${t.wrongStrict} ${word}`}
          </div>
          <button
            className="px-3 py-2 rounded-xl border"
            onClick={() => onAnswer(ok)}
          >
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}

function TypeIn({
  word,
  hintParts,
  t,
  onAnswer,
}: {
  word: string;
  hintParts: { trans: string; mask: string };
  t: (typeof LANG)['ru'];
  onAnswer: (ok: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(false);
  const ok = value.trim().toLowerCase() === word.toLowerCase();

  return (
    <div className="p-4 rounded-2xl border bg-white space-y-3">
      <div className="text-sm font-medium">{t.type_title}</div>

      {/* Только перевод; «маска» уходит в placeholder */}
      <div className="text-xs text-gray-600">
        {hintParts.trans && (
          <div>
            <span className="font-medium">{t.trans}:</span> {hintParts.trans}
          </div>
        )}
      </div>

      <input
        className="w-full rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={hintParts.mask}
      />

      {!checked ? (
        <button
          className="px-3 py-2 rounded-xl bg-blue-600 text-white"
          onClick={() => setChecked(true)}
        >
          {t.check}
        </button>
      ) : (
        <div className="space-y-3">
          <div
            className={'text-sm ' + (ok ? 'text-green-700' : 'text-rose-700')}
          >
            {ok ? t.correct : `${t.wrongStrict} ${word}`}
          </div>
          <button
            className="px-3 py-2 rounded-xl border"
            onClick={() => onAnswer(ok)}
          >
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}
