"use client";
import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "./icons";
import { money } from "./ui";
import { AnimatedNumber } from "./motion";

type Row = { candidateId: string; name: string; headline: string; probability: number; evidence: string | null; error: string | null };

const EXAMPLES = [
  "Someone hands-on who worked at a small SaaS company and dealt directly with enterprise customers",
  "An engineer who has owned production systems on-call, even if their title isn't DevOps",
  "People who moved from engineering into product or management",
  "Candidates with payments or fintech experience",
];

export function AskPool({ canQuery, poolSize }: { canQuery: boolean; poolSize: number }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ query: string; rows: Row[]; usd: number; provider: string } | null>(null);
  const [err, setErr] = useState("");
  const [t, setT] = useState(0);

  async function ask(text: string) {
    if (!text.trim()) return;
    setQ(text);
    setBusy(true);
    setErr("");
    const t0 = performance.now();
    const r = await fetch("/api/pool", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: text }) });
    const j = await r.json();
    setT((performance.now() - t0) / 1000);
    setBusy(false);
    if (!r.ok) return setErr(j.error);
    setRes(j);
  }

  const fits = res?.rows.filter((r) => r.probability >= 0.5) ?? [];
  const maybe = res?.rows.filter((r) => r.probability >= 0.25 && r.probability < 0.5) ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className={clsx("card relative overflow-hidden p-2 transition-shadow focus-within:shadow-[var(--shadow)]", busy && "border-pine")}
      >
        {busy && <div className="shimmer absolute inset-x-0 top-0 h-0.5" />}
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(q);
            }
          }}
          rows={3}
          placeholder="Find me someone who…"
          className="w-full resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-faint"
        />
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-[12px] text-faint">Evaluates {poolSize} resumes · ~1 call each</span>
          <motion.button whileTap={{ scale: 0.95 }} className="btn-primary" disabled={!canQuery || busy || !q.trim()}>
            <Icon name="sparkle" weight="fill" className="size-3.5" /> {busy ? "Reading every resume…" : "Ask"}
          </motion.button>
        </div>
      </form>
      {!res && !busy && (
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <motion.button key={e} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => ask(e)} disabled={!canQuery} className="rounded-full border border-line bg-surface px-3 py-1.5 text-left text-[12.5px] text-muted hover:border-pine hover:text-fg">
              {e}
            </motion.button>
          ))}
        </div>
      )}
      {!canQuery && <p className="mt-3 text-[12px] text-warn">Hiring managers can’t query the pool. Switch role in the sidebar.</p>}
      {err && <p className="mt-3 text-[12.5px] text-bad">{err}</p>}

      <AnimatePresence mode="wait">
        {res && !busy && (
          <motion.div key={res.query} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-semibold">
                <AnimatedNumber value={fits.length} /> clear fits <span className="font-normal text-muted">· {maybe.length} possible</span>
              </h2>
              <span className="text-[12px] text-faint">
                {res.rows.length} resumes read in {t.toFixed(1)}s · {money(res.usd)} · {res.provider === "jev" ? "TypeSafe JEV" : "offline heuristic"}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {[...fits, ...maybe].map((r, i) => (
                <motion.li key={r.candidateId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.035, type: "spring", stiffness: 300, damping: 30 }}>
                  <Link href={`/candidates/${r.candidateId}`} className="card group flex items-start gap-4 p-3.5 transition-all hover:-translate-y-0.5 hover:border-control hover:shadow-[var(--shadow)]">
                    <div className="w-14 shrink-0">
                      <div className={clsx("tnum text-[18px] font-semibold", r.probability >= 0.5 ? "text-pine" : "text-warn")}>{Math.round(r.probability * 100)}</div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-subtle">
                        <motion.div className={clsx("h-full rounded-full", r.probability >= 0.5 ? "bg-pine" : "bg-lemon")} initial={{ width: 0 }} animate={{ width: `${r.probability * 100}%` }} transition={{ delay: 0.1 + i * 0.03, type: "spring", stiffness: 120, damping: 20 }} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium group-hover:underline" dir="auto">
                        {r.name} <span className="font-normal text-faint">· {r.headline}</span>
                      </div>
                      {r.evidence && (
                        <div className="mt-1.5 flex gap-2 rounded-lg border-l-2 border-lemon bg-lemon-soft/60 px-2.5 py-1.5 text-[12.5px]" dir="auto">
                          <Icon name="quote" weight="fill" className="mt-0.5 size-3 shrink-0 text-lemon-text" /> {r.evidence}
                        </div>
                      )}
                    </div>
                    <Icon name="arrowUpRight" className="size-4 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </motion.li>
              ))}
            </ul>
            {fits.length + maybe.length === 0 && <p className="mt-4 text-muted">No resume clearly fits. Try rephrasing — this is not proof the pool has no one.</p>}
            <p className="mt-4 text-[11.5px] text-faint">Number = evaluator probability that the documented experience fits your request. It ranks resumes for review; it is not a hiring prediction.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
