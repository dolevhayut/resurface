"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AnimatedBackground } from "./motion";

export function SettingsControls({ isAdmin, current, jev, llm }: { isAdmin: boolean; current: string; jev: boolean; llm: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const post = async (body: object) => {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.refresh();
  };
  return (
    <section className="card p-4">
      <h2 className="text-[14px] font-semibold">Evaluator</h2>
      <div className="mt-3 flex rounded-xl border border-line bg-subtle p-1">
        <AnimatedBackground value={current} className="rounded-lg bg-surface shadow-sm">
          {[
            { id: "jev", label: "TypeSafe JEV", ok: jev },
            { id: "heuristic", label: "Offline heuristic", ok: true },
          ].map((o) => (
            <button key={o.id} data-id={o.id} disabled={!isAdmin || !o.ok} onClick={() => post({ provider: o.id })} className={clsx("h-8 flex-1 justify-center rounded-lg text-[12.5px]", current === o.id ? "font-medium text-fg" : "text-muted")}>
              {o.label}
            </button>
          ))}
        </AnimatedBackground>
      </div>
      <dl className="mt-3 space-y-1.5 text-[12.5px]">
        <div className="flex justify-between">
          <dt className="text-muted">TYPESAFE_API_KEY</dt>
          <dd className={jev ? "text-ok" : "text-bad"}>{jev ? "configured" : "missing"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">LLM question drafting</dt>
          <dd className={llm ? "text-ok" : "text-warn"}>{llm ? "configured" : "fallback: JEV line classifier"}</dd>
        </div>
      </dl>
      <p className="mt-2 text-[11.5px] text-faint">Switching evaluator changes the idempotency key — results from different models are never mixed.</p>
      <div className="mt-4 border-t border-line pt-4">
        {confirm ? (
          <div className="flex items-center gap-2">
            <button className="btn-danger" onClick={() => post({ reset: true }).then(() => setConfirm(false))}>
              Reset everything
            </button>
            <button className="btn-ghost" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn-secondary" disabled={!isAdmin} onClick={() => setConfirm(true)}>
            Reset demo data
          </button>
        )}
        {!isAdmin && <p className="mt-2 text-[12px] text-faint">Org admin only.</p>}
      </div>
    </section>
  );
}
