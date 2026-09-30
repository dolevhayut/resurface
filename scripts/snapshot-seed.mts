/* Copies completed runs from the local data/db.json into data/seed/seed.json, so a fresh deploy
   (even without API keys) opens with real JEV results. Run after "Evaluate pool for all jobs". */
import fs from "node:fs";

const db = JSON.parse(fs.readFileSync("data/db.json", "utf8"));
const seed = JSON.parse(fs.readFileSync("data/seed/seed.json", "utf8"));
const runs = db.runs.filter((r: { status: string; paceMs?: number }) => r.status === "completed" && !r.paceMs);
const ids = new Set(runs.map((r: { id: string }) => r.id));
seed.runs = runs;
seed.tasks = db.tasks.filter((t: { runId: string }) => ids.has(t.runId));
seed.evaluations = db.evaluations.filter((e: { runId: string }) => ids.has(e.runId));
seed.usage = db.usage.filter((u: { runId?: string }) => u.runId && ids.has(u.runId));
fs.writeFileSync("data/seed/seed.json", JSON.stringify(seed));
console.log(`snapshot: ${runs.length} runs, ${seed.evaluations.length} evaluations → data/seed/seed.json (${(fs.statSync("data/seed/seed.json").size / 1e6).toFixed(1)} MB)`);
