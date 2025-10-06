import { useEffect, useMemo, useState } from 'react';

type Row = { term: string; ru: string; example: string };
type OnboardingData = {
  goal: string;
  style?: string;
  weeks: number;
  words: number;
};

type CatalogTargets = { light: number; standard: number; intense: number };
type CatalogMode = {
  light?: string[];
  standard?: string[];
  intense?: string[];
  targets?: CatalogTargets;
};

type Catalog60Plus = {
  themes: string[];
  recommended: string[];
  target: number;
};

type Catalog = {
  // goal: travel | law | it | "60plus"
  [goal: string]: {
    // style: everyday | academic | simplified
    [style: string]: CatalogMode | Catalog60Plus;
  };
};

function parseCSV(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Простая запятая-разделитель для MVP (достаточно для наших демо-файлов)
    const [term = '', ru = '', example = ''] = line.split(',');
    const r = { term: term.trim(), ru: ru.trim(), example: example.trim() };
    if (r.term) rows.push(r);
  }
  return rows;
}

async function fetchText(path: string): Promise<string> {
  // все файлы лежат в public/demo → доступны по /demo/...
  const res = await fetch(path.startsWith('/') ? path : `/${path}`);
  if (!res.ok) throw new Error(`Fetch failed: ${path} (${res.status})`);
  return res.text();
}

async function fetchCSVRows(paths: string[]): Promise<Row[]> {
  const all: Row[] = [];
  for (const p of paths) {
    const txt = await fetchText(p);
    all.push(...parseCSV(txt));
  }
  return all;
}

export default function Vocab() {
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // читаем данные онбординга (цель/стиль/срок/объём)
  const onboarding = useMemo<OnboardingData | null>(() => {
    try {
      const raw = localStorage.getItem('onboarding');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const goal = onboarding?.goal || 'travel';
  // по умолчанию everyday (если стиль не выбран или его нет для цели)
  const style =
    onboarding?.style || (goal === '60plus' ? 'simplified' : 'everyday');
  const targetWords = onboarding?.words || 150;

  useEffect(() => {
    loadByGoalAndStyle().catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, style, targetWords]);

  async function loadByGoalAndStyle() {
    setLoading(true);
    setError('');
    try {
      const rawCatalog = await fetchText('/demo/catalog.json');
      const catalog: Catalog = JSON.parse(rawCatalog);

      if (goal !== '60plus') {
        // обычные цели: travel / law / it
        const goalNode = catalog[goal];
        if (!goalNode) throw new Error(`Нет каталога для цели: ${goal}`);

        const styleNode = goalNode[style] as CatalogMode | undefined;
        if (!styleNode)
          throw new Error(`Нет каталога для стиля: ${goal}/${style}`);

        // выбираем режим (light/standard/intense) по близости к targetWords
        const targets = (styleNode.targets || {
          light: 100,
          standard: 150,
          intense: 250,
        }) as CatalogTargets;
        const modes: Array<keyof CatalogTargets> = [
          'light',
          'standard',
          'intense',
        ];

        let bestMode: keyof CatalogTargets = 'standard';
        let bestDiff = Infinity;
        for (const m of modes) {
          const val = targets[m];
          if (typeof val !== 'number') continue;
          const diff = Math.abs(val - targetWords);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestMode = m;
          }
        }

        const files = (styleNode as CatalogMode)[bestMode] || [];
        if (!files.length)
          throw new Error(
            `Нет файлов для режима ${bestMode} (${goal}/${style})`
          );

        let rows = await fetchCSVRows(files);
        if (rows.length > targetWords) rows = rows.slice(0, targetWords);

        setList(rows);
        // сохраним текущий словарь — пригодится для SRS/Content
        try {
          localStorage.setItem('vocab_current', JSON.stringify(rows));
        } catch {}
      } else {
        // режим 60+: simplified с темами
        const node = catalog['60plus']['simplified'] as unknown as
          | Catalog60Plus
          | undefined;
        if (!node) throw new Error('Нет каталога для 60plus/simplified');

        // для MVP берём recommended тематики (чекбоксы добавим позже)
        const themes = node.themes || [];
        const recommendedNames = node.recommended || []; // массив имён файлов (например "health.csv")

        const recommendedPaths = themes.filter((p) =>
          recommendedNames.some((name) => p.endsWith(name))
        );

        let rows = await fetchCSVRows(recommendedPaths);
        const target = onboarding?.words || node.target || 120;
        if (rows.length > target) rows = rows.slice(0, target);

        setList(rows);
        try {
          localStorage.setItem('vocab_current', JSON.stringify(rows));
        } catch {}
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const rows = parseCSV(text);
      setList(rows);
      try {
        localStorage.setItem('vocab_current', JSON.stringify(rows));
      } catch {}
    };
    reader.readAsText(f, 'utf-8');
  }

  return (
    <div className="max-w-3xl space-y-3">
      <h1 className="text-xl font-semibold">
        Vocab (автоподбор по цели и стилю)
      </h1>

      <div className="text-sm text-slate-700">
        Цель: <b>{goal}</b> &nbsp;|&nbsp; Стиль: <b>{style}</b> &nbsp;|&nbsp;
        Целевой объём: <b>{targetWords}</b> слов
      </div>

      <div className="flex gap-2 items-center">
        <label className="text-sm flex items-center gap-2">
          <span>или загрузите свой CSV:</span>
          <input type="file" accept=".csv" onChange={onFileInput} />
        </label>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => loadByGoalAndStyle()}
          disabled={loading}
          title="Перечитать словарь из каталога по текущей цели/стилю"
        >
          Пересобрать по цели/стилю
        </button>
      </div>

      {loading && <div className="text-slate-600">Загрузка…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {list.length > 0 && !loading && !error && (
        <div className="bg-white rounded shadow p-3">
          <div className="mb-2 text-sm">
            Слов всего: <b>{list.length}</b>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {list.map((it, i) => (
              <div key={i} className="border rounded p-2">
                <div className="font-medium">
                  {it.term} → {it.ru}
                </div>
                <div className="text-slate-600 text-sm">{it.example}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && list.length === 0 && (
        <div className="text-slate-600">
          Нет данных по словарю для выбранных цели/стиля. Проверьте{' '}
          <code>public/demo/catalog.json</code> и наличие CSV-файлов.
        </div>
      )}
    </div>
  );
}
