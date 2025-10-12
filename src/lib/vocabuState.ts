// src/lib/vocabuState.ts
type VocabuPackage = {
  version: "vocabu-export-1";
  exportedAt: string;
  plan: any;
  srsQueue: any;
  srsHistory: any;
  ui?: { step?: string | number } | null;
};

const read = (k: string) => {
  try { return JSON.parse(localStorage.getItem(k) || "null"); }
  catch { return null; }
};

const write = (k: string, v: any) => {
  if (v === null || v === undefined) return;
  localStorage.setItem(k, JSON.stringify(v));
};

export function dump(): VocabuPackage {
  return {
    version: "vocabu-export-1",
    exportedAt: new Date().toISOString(),
    plan: read("plan"),
    srsQueue: read("srsQueue"),
    srsHistory: read("srsHistory"),
    ui: { step: read("ui.step") }
  };
}

export function download(pkg: VocabuPackage, fname = "vocabu_export.json") {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

export function exportVocabu(fname?: string) {
  download(dump(), fname);
}

export async function importVocabu(file: File) {
  const text = await file.text();
  const pkg = JSON.parse(text) as VocabuPackage;
  if (pkg.version !== "vocabu-export-1") {
    console.warn("Неизвестная версия пакета, импорт на свой риск:", pkg.version);
  }
  write("plan", pkg.plan);
  write("srsQueue", pkg.srsQueue);
  write("srsHistory", pkg.srsHistory);
  if (pkg.ui?.step !== undefined) localStorage.setItem("ui.step", JSON.stringify(pkg.ui.step));
  console.log("Импорт завершён. Обновите страницу приложения.");
  return pkg;
}

// Удобные вызовы из консоли
declare global { interface Window { vocabu?: any } }
if (typeof window !== "undefined") {
  (window as any).vocabu = {
    dump,
    export: exportVocabu,
    import: importVocabu
  };
}

