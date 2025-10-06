import { useEffect, useMemo, useState } from 'react';

type Row = { term: string; ru: string; example: string };
type Onboarding = {
  goal: string;
  style?: string;
  weeks: number;
  words: number;
};

type LibItem = { id: string; label: string; path: string };

function normalizeText(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

function tokenizeWords(s: string) {
  // простая токенизация: слова/апострофы/дефисы
  return s.toLowerCase().match(/[a-zа-яё'-]+/gi) || [];
}

async function fetchText(path: string) {
  const res = await fetch(path.startsWith('/') ? path : `/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path} (${res.status})`);
  return res.text();
}

export default function Content() {
  // онбординг: цель/стиль
  const onboarding = useMemo<Onboarding | null>(() => {
    try {
      const raw = localStorage.getItem('onboarding');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const goal = onboarding?.goal || 'travel';
  const style =
    onboarding?.style || (goal === '60plus' ? 'simplified' : 'everyday');

  // текущий словарь (из Vocab)
  const vocab = useMemo<Row[]>(() => {
    try {
      const raw = localStorage.getItem('vocab_current');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const [inputText, setInputText] = useState<string>('');
  const [chosenText, setChosenText] = useState<string>('');
  const [highlightedHTML, setHighlightedHTML] = useState<string>('');
  const [matchCount, setMatchCount] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // упражнения
  const [gapItems, setGapItems] = useState<
    { sentence: string; blanks: string[] }[]
  >([]);
  const [mcqItems, setMcqItems] = useState<
    { question: string; term: string; correct: string; options: string[] }[]
  >([]);
  const [answersGap, setAnswersGap] = useState<Record<string, string>>({});
  const [answersMcq, setAnswersMcq] = useState<Record<number, string>>({});
  const [checkResult, setCheckResult] = useState<{
    gapCorrect: number;
    mcqCorrect: number;
  } | null>(null);

  // мини-библиотека текстов под цель/стиль
  const library: LibItem[] = useMemo(() => {
    const map: Record<string, Record<string, LibItem[]>> = {
      travel: {
        everyday: [
          {
            id: 't1',
            label: 'Travel — Airport (Everyday)',
            path: 'demo/texts/travel/everyday_airport.txt',
          },
        ],
        academic: [
          {
            id: 't2',
            label: 'Travel — Aviation (Academic)',
            path: 'demo/texts/travel/academic_aviation.txt',
          },
        ],
      },
      law: {
        academic: [
          {
            id: 'l1',
            label: 'Law — Court case (Academic)',
            path: 'demo/texts/law/academic_court.txt',
          },
        ],
      },
      it: {
        everyday: [
          {
            id: 'i1',
            label: 'IT — Startup (Everyday)',
            path: 'demo/texts/it/everyday_startup.txt',
          },
        ],
        academic: [
          {
            id: 'i2',
            label: 'IT — Principles (Academic)',
            path: 'demo/texts/it/academic_principles.txt',
          },
        ],
      },
      '60plus': {
        simplified: [
          {
            id: 's1',
            label: '60+ — Doctor visit (Simplified)',
            path: 'demo/texts/60plus/simplified_doctor.txt',
          },
          {
            id: 's2',
            label: '60+ — Family dinner (Simplified)',
            path: 'demo/texts/60plus/simplified_family.txt',
          },
        ],
      },
    };
    const g = map[goal] || map['travel'];
    const arr = g[style] || g[Object.keys(g)[0]];
    return arr || [];
  }, [goal, style]);

  // простая модерация текста
  async function isTextAllowed(text: string) {
    try {
      const raw = await fetchText('/demo/blocklist.json');
      const data = JSON.parse(raw) as { blocked: string[] };
      const low = text.toLowerCase();
      return !data.blocked.some((w) => low.includes(w));
    } catch {
      // если не удалось загрузить список — пропускаем
      return true;
    }
  }

  // Подсветка слов из словаря
  function highlightVocab(text: string, vocabTerms: string[]) {
    // Сортируем по длине (длинные раньше), чтобы не ломать подстроки
    const terms = [...vocabTerms]
      .sort((a, b) => b.length - a.length)
      .map((t) => t.toLowerCase());
    let html = text;
    for (const t of terms) {
      const safe = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${safe}\\b`, 'gi');
      html = html.replace(re, (m) => `<mark class="bg-yellow-200">${m}</mark>`);
    }
    return html;
  }

  // Генерация GAP-FILL
  function buildGapFill(text: string, vocabTerms: string[]) {
    const sentences = text
      .split(/([.!?]\s+)/)
      .reduce<string[]>((acc, cur, i, arr) => {
        if (i % 2 === 0) acc.push((cur + (arr[i + 1] || '')).trim());
        return acc;
      }, [])
      .filter(Boolean);

    const selected: { sentence: string; blanks: string[] }[] = [];
    const termsSet = new Set<string>(vocabTerms.map((t) => t.toLowerCase()));
    for (const s of sentences) {
      const tokens = tokenizeWords(s);
      const blanks: string[] = [];
      let has = false;
      const replaced = tokens.map((w) => {
        const lw = w.toLowerCase();
        if (termsSet.has(lw) && !blanks.includes(lw)) {
          has = true;
          blanks.push(lw);
          return '____';
        }
        return w;
      });
      if (has) {
        // собрать предложение обратно (очень простой реконструктор)
        const reconstructed = s.replace(
          /[a-zа-яё'-]+/gi,
          () => replaced.shift() || ''
        );
        selected.push({ sentence: reconstructed, blanks });
      }
      if (selected.length >= 5) break; // ограничим до 5 предложений
    }
    return selected;
  }

  // Генерация Multiple Choice
  function buildMCQ(text: string, vocabList: Row[]) {
    const maxQ = 6;
    const terms = vocabList.slice(0, 50); // ограничим выборку
    const picked: Row[] = [];
    const used = new Set<string>();
    // выбираем до 6 уникальных слов
    for (const r of terms) {
      const lw = r.term.toLowerCase();
      if (!used.has(lw)) {
        picked.push(r);
        used.add(lw);
      }
      if (picked.length >= maxQ) break;
    }
    // строим варианты с отвлекающими переводами
    const allTranslations = terms.map((t) => t.ru);
    const items = picked.map((r, idx) => {
      const correct = r.ru;
      // выбираем 2-3 других перевода в качестве отвлекающих
      const distractors = allTranslations
        .filter((x) => x !== correct)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = [...distractors, correct].sort(() => Math.random() - 0.5);
      return {
        question: `Выберите перевод слова: "${r.term}"`,
        term: r.term,
        correct,
        options,
      };
    });
    return items;
  }

  // Основной пайплайн: подать текст → подсветка → построить упражнения
  async function processText(raw: string) {
    setError('');
    const clean = normalizeText(raw);
    if (!clean) {
      setChosenText('');
      setHighlightedHTML('');
      setMatchCount(0);
      setGapItems([]);
      setMcqItems([]);
      setCheckResult(null);
      return;
    }

    // модерация
    const ok = await isTextAllowed(clean);
    if (!ok) {
      setError(
        'Этот текст не подходит для обучения. Пожалуйста, выберите другой текст.'
      );
      return;
    }

    // какие слова из словаря встречаются?
    const vocabTerms = Array.from(
      new Set(vocab.map((v) => v.term.toLowerCase()))
    );
    const words = tokenizeWords(clean);
    const found = new Set<string>();
    for (const w of words) {
      if (vocabTerms.includes(w.toLowerCase())) found.add(w.toLowerCase());
    }

    // подсветка + генерация заданий
    const html = highlightVocab(clean, Array.from(found));
    setChosenText(clean);
    setHighlightedHTML(html);
    setMatchCount(found.size);

    const gaps = buildGapFill(clean, Array.from(found));
    setGapItems(gaps);

    const mcq = buildMCQ(clean, vocab);
    setMcqItems(mcq);

    // сброс ответов
    setAnswersGap({});
    setAnswersMcq({});
    setCheckResult(null);
  }

  // Загрузка текста из библиотеки
  async function loadFromLibrary(path: string) {
    try {
      const txt = await fetchText(path);
      setInputText(txt);
      await processText(txt);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  // Проверка ответов по обоим упражнениям
  function checkAll() {
    // GAP
    let okGap = 0,
      totalGap = 0;
    gapItems.forEach((it, idx) => {
      it.blanks.forEach((b, j) => {
        totalGap++;
        const key = `${idx}:${j}`;
        if ((answersGap[key] || '').trim().toLowerCase() === b.toLowerCase())
          okGap++;
      });
    });
    // MCQ
    let okMCQ = 0;
    mcqItems.forEach((q, i) => {
      if ((answersMcq[i] || '') === q.correct) okMCQ++;
    });
    setCheckResult({ gapCorrect: okGap, mcqCorrect: okMCQ });
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-semibold">Content: ваш текст → упражнения</h1>

      <div className="text-sm text-slate-700">
        Цель: <b>{goal}</b> &nbsp;|&nbsp; Стиль: <b>{style}</b> &nbsp;|&nbsp;
        Слов в словаре: <b>{vocab.length}</b>
      </div>

      {/* Выбор из библиотеки */}
      {library.length > 0 && (
        <div className="p-3 border rounded space-y-2">
          <div className="font-medium">
            Мини-библиотека по вашей цели/стилю:
          </div>
          <div className="flex flex-wrap gap-2">
            {library.map((item) => (
              <button
                key={item.id}
                onClick={() => loadFromLibrary(item.path)}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Вставка своего текста */}
      <div className="p-3 border rounded space-y-2">
        <div className="font-medium">
          Или вставьте свой текст (до ~500 слов):
        </div>
        <textarea
          className="w-full border rounded p-2 h-36"
          placeholder="Вставьте сюда текст на английском..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={() => processText(inputText)}
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={!inputText.trim()}
          >
            Сгенерировать упражнения
          </button>
          <button
            onClick={() => {
              setInputText('');
              setChosenText('');
              setHighlightedHTML('');
              setGapItems([]);
              setMcqItems([]);
              setMatchCount(0);
              setError('');
              setCheckResult(null);
            }}
            className="px-3 py-1 border rounded"
          >
            Очистить
          </button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
      </div>

      {/* Подсветка текста */}
      {chosenText && (
        <div className="p-3 border rounded space-y-2">
          <div className="text-sm">
            Найдено слов из вашего словаря: <b>{matchCount}</b>
          </div>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: highlightedHTML }}
          />
        </div>
      )}

      {/* Упражнение 1: GAP-FILL */}
      {gapItems.length > 0 && (
        <div className="p-3 border rounded space-y-3">
          <div className="font-medium">Упражнение: Gap-fill</div>
          {gapItems.map((it, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-sm text-slate-700">{it.sentence}</div>
              <div className="flex flex-wrap gap-2">
                {it.blanks.map((b, j) => {
                  const key = `${idx}:${j}`;
                  return (
                    <input
                      key={key}
                      placeholder="вставьте слово"
                      className="border rounded px-2 py-1"
                      value={answersGap[key] || ''}
                      onChange={(e) =>
                        setAnswersGap((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Упражнение 2: Multiple choice */}
      {mcqItems.length > 0 && (
        <div className="p-3 border rounded space-y-3">
          <div className="font-medium">Упражнение: Multiple choice</div>
          {mcqItems.map((q, i) => (
            <div key={i} className="space-y-1">
              <div>{q.question}</div>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt, k) => (
                  <label
                    key={k}
                    className="text-sm border rounded px-2 py-1 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`mcq-${i}`}
                      className="mr-1"
                      checked={answersMcq[i] === opt}
                      onChange={() =>
                        setAnswersMcq((prev) => ({ ...prev, [i]: opt }))
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка проверки и результат */}
      {(gapItems.length > 0 || mcqItems.length > 0) && (
        <div className="flex items-center gap-3">
          <button
            onClick={checkAll}
            className="px-3 py-1 bg-green-600 text-white rounded"
          >
            Проверить ответы
          </button>
          {checkResult && (
            <div className="text-sm">
              Gap-fill: <b>{checkResult.gapCorrect}</b> верно из{' '}
              <b>{gapItems.reduce((acc, it) => acc + it.blanks.length, 0)}</b>{' '}
              &nbsp; | &nbsp; Multiple choice: <b>{checkResult.mcqCorrect}</b>{' '}
              верно из <b>{mcqItems.length}</b>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
