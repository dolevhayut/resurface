"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import clsx from "clsx";
import { Icon } from "./icons";

export function RunAllButton({ jobs, disabled, className }: { jobs: number; disabled?: boolean; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <span data-tour="run-all" className="inline-flex flex-col">
      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ y: -1 }}
        className={clsx("btn-primary relative overflow-hidden", className)}
        disabled={disabled || busy}
        onClick={async () => {
          setBusy(true);
          const r = await fetch("/api/runs/all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ budgetUsd: 0.5 }) });
          const j = await r.json();
          setBusy(false);
          if (!r.ok) return setErr(j.error);
          router.push("/jobs?live=1");
          router.refresh();
        }}
      >
        {busy && <span className="shimmer absolute inset-0" />}
        <Icon name="bolt" weight="fill" className="size-3.5 text-lemon" /> {busy ? "Starting…" : `Evaluate pool for all ${jobs} jobs`}
      </motion.button>
      {err && <span className="mt-1 text-[12px] text-bad">{err}</span>}
    </span>
  );
}
