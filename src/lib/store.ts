import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { DB } from "./types";

// MVP persistence: a single JSON document with atomic writes, held in memory by the
// one Node process that also runs the worker. The shape mirrors the Postgres tables in
// PRD §10 so it can be swapped for Postgres + a durable queue without touching callers.

export const TENANT = "org_demo";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SEED_DIR = path.join(DATA_DIR, "seed");

type G = typeof globalThis & { __cvleapDb?: DB; __cvleapSaveTimer?: NodeJS.Timeout };
const g = globalThis as G;

function emptyDb(): DB {
  return {
    meta: { seededAt: new Date().toISOString(), schema: 1 },
    organizations: [{ id: TENANT, name: "Demo Org" }],
    candidates: [],
    imports: [],
    jobs: [],
    rubrics: [],
    runs: [],
    tasks: [],
    evaluations: [],
    shortlists: [],
    feedback: [],
    audit: [],
    usage: [],
  };
}

function loadSeed(): DB {
  const db = emptyDb();
  const read = <T,>(f: string): T | null => {
    const p = path.join(SEED_DIR, f);
    return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")) as T) : null;
  };
  const seed = read<Partial<DB>>("seed.json");
  if (seed) Object.assign(db, seed);
  return db;
}

export function db(): DB {
  if (!g.__cvleapDb) {
    if (fs.existsSync(DB_FILE)) {
      g.__cvleapDb = { ...emptyDb(), ...(JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB) };
    } else {
      g.__cvleapDb = loadSeed();
      flush();
    }
  }
  return g.__cvleapDb!;
}

export function flush() {
  if (!g.__cvleapDb) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(g.__cvleapDb));
  fs.renameSync(tmp, DB_FILE);
}

/** Debounced checkpoint — the worker calls this after every completed task. */
export function save() {
  if (g.__cvleapSaveTimer) return;
  g.__cvleapSaveTimer = setTimeout(() => {
    g.__cvleapSaveTimer = undefined;
    flush();
  }, 150);
}

export function resetToSeed() {
  g.__cvleapDb = loadSeed();
  flush();
}

export const uid = (p: string) => `${p}_${crypto.randomBytes(6).toString("hex")}`;
export const now = () => new Date().toISOString();
export const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);

export function audit(actor: string, action: string, target: string, detail?: string) {
  db().audit.unshift({ id: uid("aud"), tenantId: TENANT, at: now(), actor, action, target, detail });
  save();
}

// Scoped reads: every query filters by tenant and hides tombstoned records.
export const candidatesOf = (tenantId = TENANT) =>
  db().candidates.filter((c) => c.tenantId === tenantId && !c.deletedAt);
export const jobsOf = (tenantId = TENANT) => db().jobs.filter((j) => j.tenantId === tenantId);
export const runsOf = (tenantId = TENANT) => db().runs.filter((r) => r.tenantId === tenantId);
