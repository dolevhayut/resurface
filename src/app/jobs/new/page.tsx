"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, Page } from "@/components/ui";

export default function NewJob() {
  const router = useRouter();
  const [f, setF] = useState({ title: "", team: "", location: "", description: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error);
      setBusy(false);
      return;
    }
    router.push(`/jobs/${j.id}`);
  }
  return (
    <>
      <PageHeader eyebrow="Jobs" title="New job" subtitle="Paste a job description. Criteria are drafted from its lines — each one keeps a link to its source." />
      <Page>
        <form onSubmit={submit} className="card max-w-3xl space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {(["title", "team", "location"] as const).map((k) => (
              <label key={k} className="space-y-1.5">
                <span className="label capitalize">{k}</span>
                <input className="input" value={f[k]} required={k === "title"} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
              </label>
            ))}
          </div>
          <label className="block space-y-1.5">
            <span className="label">Job description</span>
            <textarea
              className="input h-80 py-2 font-mono text-[12.5px] leading-5"
              required
              value={f.description}
              placeholder={"About the role:\n…\nRequirements:\n- 5+ years of …\n- Hands-on …\nNice to have:\n- …"}
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />
          </label>
          {err && <p className="text-[12.5px] text-bad">{err}</p>}
          <div className="flex justify-end">
            <button className="btn-primary" disabled={busy}>
              {busy ? "Creating…" : "Create job"}
            </button>
          </div>
        </form>
      </Page>
    </>
  );
}
