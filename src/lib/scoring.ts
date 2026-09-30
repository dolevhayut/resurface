import type { Criterion, CriterionResult } from "./types";

// Ranking (PRD §8). Known match is computed only over criteria with valid evidence;
// missing evidence is never turned into 0. Coverage says how much of the rubric is known.

export type Group = "strong" | "verify" | "lower" | "not_evaluated";

export interface Match {
  known: number | null; // Σ(w·s)/Σw over known criteria
  coverage: number; // known weight / total weight
  lower: number; // unknowns scored 0
  upper: number; // unknowns scored 1
  mustGaps: string[]; // must-haves not established / needs verification
  mustContradicted: string[];
  supported: number;
  group: Group;
  complete: boolean; // all criteria evaluated (not just stage 1)
}

export const THRESHOLDS = { strongKnown: 0.75, strongCoverage: 0.7 };

export function scoreOf(r: CriterionResult | undefined): number | null {
  if (!r) return null;
  if (r.evidenceStatus === "supported") return 1;
  if (r.evidenceStatus === "contradicted") return 0;
  return null; // not established / needs verification → unknown
}

export function computeMatch(criteria: Criterion[], results: CriterionResult[], weights?: Record<string, number>): Match {
  const byId = new Map(results.map((r) => [r.criterionId, r]));
  let total = 0,
    knownW = 0,
    knownSum = 0;
  const mustGaps: string[] = [];
  const mustContradicted: string[] = [];
  let supported = 0;
  for (const c of criteria) {
    const w = weights?.[c.id] ?? c.weight;
    total += w;
    const s = scoreOf(byId.get(c.id));
    if (s !== null) {
      knownW += w;
      knownSum += w * s;
    }
    if (s === 1) supported++;
    if (c.requirement === "must") {
      if (s === 0) mustContradicted.push(c.label);
      else if (s === null) mustGaps.push(c.label);
    }
  }
  const known = knownW ? knownSum / knownW : null;
  const coverage = total ? knownW / total : 0;
  const lower = total ? knownSum / total : 0;
  const upper = total ? (knownSum + (total - knownW)) / total : 0;
  const complete = criteria.every((c) => byId.has(c.id));

  let group: Group;
  if (!results.length) group = "not_evaluated";
  else if (mustContradicted.length || (known !== null && known < 0.5 && coverage >= 0.5)) group = "lower";
  else if (known !== null && known >= THRESHOLDS.strongKnown && coverage >= THRESHOLDS.strongCoverage && !mustGaps.length && complete)
    group = "strong";
  else if (mustGaps.length <= 1 && lower >= 0.35 && upper >= 0.6) group = "verify";
  else group = "lower";

  return { known, coverage, lower, upper, mustGaps, mustContradicted, supported, group, complete };
}

export const GROUP_LABEL: Record<Group, string> = {
  strong: "Strong evidence",
  verify: "Needs verification",
  lower: "Lower evidence match",
  not_evaluated: "Not evaluated",
};

export function sortMatches<T extends { match: Match }>(rows: T[]) {
  const order: Record<Group, number> = { strong: 0, verify: 1, lower: 2, not_evaluated: 3 };
  return rows.sort(
    (a, b) =>
      order[a.match.group] - order[b.match.group] ||
      b.match.lower - a.match.lower ||
      b.match.upper - a.match.upper ||
      b.match.coverage - a.match.coverage,
  );
}
