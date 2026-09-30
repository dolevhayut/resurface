// Quantitative requirements (e.g. "5+ years") are computed in code from normalized dates,
// merging overlapping periods so parallel roles are not double counted (PRD §6).

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export interface Period {
  lineId: string;
  start: number; // months since epoch-ish (year*12+month)
  end: number;
}

const TODAY = (() => {
  const d = new Date("2026-09-01");
  return d.getFullYear() * 12 + d.getMonth();
})();

function point(tok: string): number | null {
  const t = tok.trim().toLowerCase();
  if (/^(present|current|now|today|היום|כיום)$/.test(t)) return TODAY;
  let m = t.match(/^([a-z]{3})[a-z]*\.?\s+(\d{4})$/);
  if (m && MONTHS[m[1]] !== undefined) return +m[2] * 12 + MONTHS[m[1]];
  m = t.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return +m[2] * 12 + (+m[1] - 1);
  m = t.match(/^(\d{4})$/);
  if (m) return +m[1] * 12;
  return null;
}

const RANGE =
  /((?:[A-Za-z]{3,9}\.?\s+)?\d{4}|\d{1,2}\/\d{4})\s*(?:–|-|—|to)\s*((?:[A-Za-z]{3,9}\.?\s+)?\d{4}|\d{1,2}\/\d{4}|present|current|now|היום|כיום)/i;

export function periodsFrom(lines: { id: string; text: string }[]): Period[] {
  const out: Period[] = [];
  for (const l of lines) {
    const m = l.text.match(RANGE);
    if (!m) continue;
    const s = point(m[1]);
    let e = point(m[2]);
    if (s === null || e === null) continue;
    if (/^\d{4}$/.test(m[2].trim())) e += 11; // "2019 – 2021" covers through end of 2021
    if (e >= s) out.push({ lineId: l.id, start: s, end: e });
  }
  return out;
}

export function mergedYears(periods: Period[]): number {
  const sorted = [...periods].sort((a, b) => a.start - b.start);
  let total = 0;
  let cur: { s: number; e: number } | null = null;
  for (const p of sorted) {
    if (!cur || p.start > cur.e + 1) {
      if (cur) total += cur.e - cur.s + 1;
      cur = { s: p.start, e: p.end };
    } else cur.e = Math.max(cur.e, p.end);
  }
  if (cur) total += cur.e - cur.s + 1;
  return Math.round((total / 12) * 10) / 10;
}
