import React, { useEffect, useMemo, useState } from 'react';
import type { UILocale } from '../../types';

/** Мини-SM2 + учёт дневного прогресса (MVP)
 *  - quality: 0(Again), 3(Hard), 4(Good), 5(Easy)
 *  - дневной прогресс хранится в LS ключом 'vocabu.progress.v1'
 */

type CardState = {
  ef: number;
  reps: number;
  interval: number; // в днях
  due: string; // YYYY-MM-DD
};

type SRSMap = Record<string, CardState>;

const SRS_KEY = 'vocabu_srs_store_v1';
const APP_STATE_KEY = 'vocabu_mvp_state';
const LOG_KEY = 'vocabu_learn_log_v1';
const PROGRESS_KEY = 'vocabu.progress.v1';

type ProgressState = {
  date: string; // YYYY-MM-DD
  done: number; // инкрементируется 1 раз/карточку в день
  target: number; // дневная цель
  countedIds: string[]; // какие слова уже учтены сегодня
};

// ——— Подсказки по контексту (та же идея, что в упражнениях)
const HINTS: Record<string, Record<string, { ru: string; en: string }>> = {
  travel: {
    ticket: { ru: 'билет', en: 'ticket' },
    flight: { ru: 'рейс, перелёт', en: 'flight (plane)' },
    gate: { ru: 'выход на посадку', en: 'boarding gate' },
    luggage: { ru: 'багаж', en: 'luggage' },
    passport: { ru: 'паспорт', en: 'passport' },
    hotel: { ru: 'отель', en: 'hotel' },
    taxi: { ru: 'такси', en: 'taxi' },
    map: { ru: 'карта', en: 'map' },
    train: { ru: 'поезд', en: 'train' },
    restaurant: { ru: 'ресторан', en: 'restaurant' },
  },
  law: {
    court: { ru: 'суд', en: 'court' },
    judge: { ru: 'судья', en: 'judge' },
    lawyer: { ru: 'адвокат', en: 'lawyer' },
    plaintiff: { ru: 'истец', en: 'plaintiff' },
    evidence: { ru: 'доказательство', en: 'evidence' },
    contract: { ru: 'договор', en: 'contract' },
  },
  it: {
    server: { ru: 'сервер', en: 'server' },
    database: { ru: 'база данных', en: 'database' },
    bug: { ru: 'ошибка', en: 'bug' },
    deploy: { ru: 'выкатка', en: 'deploy' },
    cloud: { ru: 'облако', en: 'cloud' },
  },
  senior: {
    clinic: { ru: 'поликлиника', en: 'clinic' },
    appointment: { ru: 'запись на приём', en: 'appointment' },
    insurance: { ru: 'страховка', en: 'insurance' },
    pharmacy: { ru: 'аптека', en: 'pharmacy' },
    benefits: { ru: 'льготы', en: 'benefits' },
  },
};

const LANG = {
  ru: {
    title: 'Повторение (SRS)',
    nothing_today: 'На сегодня карточек нет. Отличный повод отдохнуть 🙂',
    seed_new: 'Добавить пару новых на сегодня',
    progress: 'Прогресс',
    updated: (n: number, today: number, later: number) =>
      `Обновили расписание: ${n} слов (${today} сегодня, ${later} позже)`,
    buttons: { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' },
    hint: 'Подсказка',
    finish: 'Завершить',
  },
  en: {
    title: 'Review (SRS)',
    nothing_today: 'Nothing due today. Great time to rest 🙂',
    seed_new: 'Add a couple of new ones for today',
    progress: 'Progress',
    updated: (n: number, today: number, later: number) =>
      `Schedule updated: ${n} words (${today} today, ${later} later)`,
    buttons: { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' },
    hint: 'Hint',
    finish: 'Finish',
  },
};

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
const getProgress = (): ProgressState => {
  const raw = localStorage.getItem(PROGRESS_KEY);
  const today = todayISO();
  try {
    const parsed = raw ? (JSON.parse(raw) as ProgressState) : null;
    if (!parsed || parsed.date !== today) {
      const fresh: ProgressState = {
        date: today,
        done: 0,
        target: 0,
        countedIds: [],
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return parsed;
  } catch {
    const fresh: ProgressState = {
      date: today,
      done: 0,
      target: 0,
      countedIds: [],
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(fresh));
    return fresh;
  }
};
const setProgress = (st: ProgressState) =>
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(st));
const setProgressTarget = (target: number) => {
  const st = getProgress();
  setProgress({ ...st, target: Math.max(0, Math.floor(target)) || 0 });
};
const incrementProgressOnce = (id: string) => {
  const st = getProgress();
  if (!id || st.countedIds.includes(id)) return;
  setProgress({ ...st, done: st.done + 1, countedIds: [...st.countedIds, id] });
};

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
function mask(word: string) {
  if (word.length <= 2) return word;
  return `${word[0]}${'•'.repeat(Math.max(1, word.length - 2))}${
    word[word.length - 1]
  }`;
}
function getPlanFromLocal() {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s?.plan ?? null;
  } catch {
    return null;
  }
}
function loadSRS(): SRSMap {
  try {
    const raw = localStorage.getItem(SRS_KEY);
    return raw ? (JSON.parse(raw) as SRSMap) : {};
  } catch {
    return {};
  }
}
function saveSRS(map: SRSMap) {
  localStorage.setItem(SRS_KEY, JSON.stringify(map));
}
function rateSM2(card: CardState, quality: 0 | 3 | 4 | 5): CardState {
  let ef = card.ef ?? 2.5;
  let reps = card.reps ?? 0;
  let interval = card.interval ?? 0;

  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps += 1;
  }

  const q = quality === 0 ? 2 : quality;
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;

  const due = addDays(todayISO(), interval);
  return { ef, reps, interval, due };
}

/** Применить авто-лог из обучения и вернуть сводку */
function applyAutoFromLearnLog(pool: string[], store: SRSMap) {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return { applied: 0, today: 0, later: 0, store };
    const data: { date: string; items: Record<string, number> } =
      JSON.parse(raw);
    if (data.date !== todayISO())
      return { applied: 0, today: 0, later: 0, store };

    let applied = 0,
      today = 0,
      later = 0;
    const iso = todayISO();
    const nextStore: SRSMap = { ...store };

    for (const [wordLower, q] of Object.entries(data.items)) {
      if (
        !pool.includes(wordLower) &&
        !pool.includes(wordLower.toLowerCase())
      ) {
        continue;
      }
      const prev = nextStore[wordLower] ?? {
        ef: 2.5,
        reps: 0,
        interval: 0,
        due: iso,
      };
      const next = rateSM2(prev, q as 0 | 3 | 4 | 5);
      nextStore[wordLower] = next;
      applied += 1;
      if ((next.due ?? iso) <= iso) today += 1;
      else later += 1;
    }

    if (applied > 0) {
      saveSRS(nextStore);
      localStorage.removeItem(LOG_KEY);
    }
    return { applied, today, later, store: nextStore };
  } catch {
    return { applied: 0, today: 0, later: 0, store };
  }
}

export default function SRSDeckAdapter({
  onFinish,
  locale = 'ru',
}: {
  onFinish: () => void;
  locale?: UILocale;
}) {
  const t = LANG[locale] ?? LANG.ru;

  // 1) План из localStorage
  const plan = useMemo(() => getPlanFromLocal(), []);
  const contextId: string = plan?.contextId ?? 'travel';

  // выставим дневную цель один раз при входе в SRS
  useEffect(() => {
    const target =
      Number(plan?.recommendation?.perDay) ||
      Number(plan?.todaySet?.length || 0) ||
      0;
    setProgressTarget(target);
  }, []); // eslint-disable-line

  // 2) Пул слов (источник для SRS)
  const pool: string[] = useMemo(() => {
    const arr = [...(plan?.todaySet ?? []), ...(plan?.weekPackage ?? [])].map(
      (w: any) => String(typeof w === 'string' ? w : w?.term ?? w).toLowerCase()
    );
    const uniq = Array.from(new Set(arr));
    return uniq.length
      ? uniq
      : ['ticket', 'flight', 'gate', 'luggage', 'hotel', 'taxi', 'map'];
  }, [plan]);

  // 3) SRS-хранилище
  const [store, setStore] = useState<SRSMap>(() => {
    const s = loadSRS();
    const iso = todayISO();
    pool.forEach((w) => {
      if (!s[w]) s[w] = { ef: 2.5, reps: 0, interval: 0, due: iso };
    });
    saveSRS(s);
    return s;
  });

  // 4) Авто-применение результатов обучения
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const res = applyAutoFromLearnLog(pool, store);
    if (res.applied > 0) {
      setStore(res.store);
      setNotice(
        LANG[locale]?.updated(res.applied, res.today, res.later) ??
          LANG.ru.updated(res.applied, res.today, res.later)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // один раз при входе в SRS

  // 5) Очередь «на сегодня» + сессия
  const computeDueToday = (s: SRSMap) => {
    const iso = todayISO();
    const due = pool.filter((w) => (s[w]?.due ?? iso) <= iso);
    return due.length === 0 ? pool.slice(0, Math.min(5, pool.length)) : due;
  };

  const [session, setSession] = useState<string[]>(() =>
    computeDueToday(store).slice(0, 10)
  );
  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(session.length === 0);

  // Если пришло авто-обновление — пересоберём сессию
  useEffect(() => {
    const due = computeDueToday(store).slice(0, 10);
    setSession(due);
    setIdx(0);
    setFinished(due.length === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const current = session[idx];
  const progress = `${Math.min(idx + 1, session.length)}/${
    session.length || 1
  }`;

  const hint = useMemo(() => {
    const entry =
      HINTS[contextId]?.[current]?.[locale] || HINTS[contextId]?.[current]?.ru;
    return entry ? `${entry} • ${mask(current)}` : mask(current);
  }, [current, contextId, locale]);

  function rate(quality: 0 | 3 | 4 | 5) {
    // инкремент дневного прогресса (1 раз на слово в день)
    incrementProgressOnce(current);

    const prev = store[current] ?? {
      ef: 2.5,
      reps: 0,
      interval: 0,
      due: todayISO(),
    };
    const nextState = rateSM2(prev, quality);
    const newStore = { ...store, [current]: nextState };
    setStore(newStore);
    saveSRS(newStore);

    if (idx + 1 >= session.length) setFinished(true);
    else setIdx((v) => v + 1);
  }

  if (finished) {
    return (
      <div className="p-4 rounded-2xl border bg-white space-y-3">
        <div className="text-lg font-semibold">{t.title}</div>
        {notice && <div className="text-xs text-gray-600">{notice}</div>}
        <div className="text-sm text-gray-600">
          {session.length === 0
            ? t.nothing_today
            : `${t.progress}: ${progress}`}
        </div>
        {session.length === 0 && (
          <button
            className="mt-2 px-3 py-2 rounded-xl border"
            onClick={() => {
              const iso = todayISO();
              const extra = pool.slice(0, Math.min(3, pool.length));
              const s = { ...store };
              extra.forEach(
                (w) => (s[w] = { ef: 2.5, reps: 0, interval: 0, due: iso })
              );
              saveSRS(s);
              setStore(s);
            }}
          >
            {t.seed_new}
          </button>
        )}
        <div>
          <button
            className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white"
            onClick={onFinish}
          >
            {t.finish}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl border bg-white space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{t.title}</div>
        <div className="text-xs text-gray-500">
          {t.progress}: {progress}
        </div>
      </div>

      {notice && <div className="text-xs text-gray-600">{notice}</div>}

      <div className="space-y-2">
        <div className="text-2xl font-semibold">{current}</div>
        <div className="text-sm text-gray-600">
          {LANG[locale]?.hint || LANG.ru.hint}: {hint}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button className="px-3 py-2 rounded-xl border" onClick={() => rate(0)}>
          {t.buttons.again}
        </button>
        <button className="px-3 py-2 rounded-xl border" onClick={() => rate(3)}>
          {t.buttons.hard}
        </button>
        <button className="px-3 py-2 rounded-xl border" onClick={() => rate(4)}>
          {t.buttons.good}
        </button>
        <button className="px-3 py-2 rounded-xl border" onClick={() => rate(5)}>
          {t.buttons.easy}
        </button>
      </div>
    </div>
  );
}
