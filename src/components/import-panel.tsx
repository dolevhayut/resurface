"use client";
import { CLOUD_URL } from "@/lib/cloud";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "./icons";
import { ago } from "./ui";

type Item = { source: string; status: string; message?: string };
type Summary = { files: number; created: number; updated: number; duplicates: number; failed: number; items: Item[]; at?: string };

export function ImportPanel({ canImport, last }: { canImport: boolean; last: Summary | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Summary | null>(null);
  const [err, setErr] = useState("");
  const shown = res ?? last;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const r = await fetch("/api/imports", { method: "POST", body: fd });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error);
    setRes({ ...j, items: j.items.filter((i: Item) => i.status !== "created").slice(0, 6) });
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <motion.label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (canImport) upload(e.dataTransfer.files);
        }}
        animate={{ scale: drag ? 1.015 : 1 }}
        className={clsx(
          "grain relative grid cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed px-6 py-8 text-center transition-colors",
          drag ? "border-pine bg-pine-soft" : "border-control bg-surface hover:border-pine",
          !canImport && "cursor-not-allowed opacity-60",
        )}
      >
        <input ref={input} type="file" multiple accept=".pdf,.docx,.txt,.csv" className="sr-only" disabled={!canImport || busy} onChange={(e) => upload(e.target.files)} />
        {busy && <div className="shimmer absolute inset-0" />}
        <motion.div animate={{ y: drag ? -4 : 0 }} className="grid size-11 place-items-center rounded-2xl bg-pine-soft text-pine">
          <Icon name="upload" weight="duotone" className="size-5" />
        </motion.div>
        <div className="mt-3 text-[13.5px] font-medium">{busy ? "Parsing & de-duplicating…" : "Drop resumes to import"}</div>
        <div className="mt-0.5 text-[12px] text-muted">PDF, DOCX, TXT, or CSV (name, email, headline, resume_text)</div>
        <div className="mt-2 text-[11.5px] text-faint">
          Demo parser. For production extraction (PDF, DOCX, HTML, Hebrew and other RTL) use the{" "}
          <a href={CLOUD_URL} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-pine underline underline-offset-2">hosted API</a>.
        </div>
        {!canImport && <div className="mt-2 text-[12px] text-warn">Switch to Org admin to import</div>}
        {err && <div className="mt-2 text-[12px] text-bad">{err}</div>}
      </motion.label>
      {shown && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold">{res ? "Import complete" : "Last import"}</h2>
            {shown.at && <span className="text-[12px] text-faint">{ago(shown.at)}</span>}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2 text-center">
            {[
              ["Files", shown.files, ""],
              ["New", shown.created, "text-ok"],
              ["Updated", shown.updated, "text-pine"],
              ["Duplicates", shown.duplicates, "text-lemon-text"],
              ["Failed", shown.failed, "text-bad"],
            ].map(([k, v, c]) => (
              <div key={String(k)} className="rounded-xl bg-subtle px-2 py-2">
                <div className={clsx("tnum text-[18px] font-semibold", String(c))}>{v}</div>
                <div className="text-[11px] text-muted">{k}</div>
              </div>
            ))}
          </div>
          <AnimatePresence>
            <ul className="mt-3 space-y-1.5">
              {shown.items.map((i) => (
                <motion.li key={i.source} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-[12px]">
                  <span className={clsx("chip", i.status === "failed" ? "bg-bad-bg text-bad" : i.status === "duplicate" ? "bg-lemon-soft text-lemon-text" : "bg-pine-soft text-pine")}>{i.status}</span>
                  <span className="font-mono text-faint">{i.source}</span>
                  <span className="truncate text-muted">{i.message}</span>
                </motion.li>
              ))}
            </ul>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
