import Link from "next/link";
import { Page, PageHeader, DemoTag, ago } from "@/components/ui";
import { ImportPanel } from "@/components/import-panel";
import { candidatesOf, db } from "@/lib/store";
import { session } from "@/lib/session";
import { isDormant } from "@/lib/insights";

export const dynamic = "force-dynamic";

export default async function Candidates({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const s = await session();
  const all = candidatesOf();
  const list = all.filter((c) => !q || `${c.name} ${c.headline} ${c.location}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const imp = db().imports[0];
  const shortlisted = new Set(db().shortlists.flatMap((x) => x.members.map((m) => m.candidateId)));
  return (
    <>
      <PageHeader title="Candidates" subtitle="Your existing pool. Import once; every job can then be evaluated against it." />
      <Page>
        <ImportPanel canImport={s.can("import")} last={imp ? { files: imp.files, created: imp.created, updated: imp.updated, duplicates: imp.duplicates, failed: imp.failed, items: imp.items.filter((i) => i.status !== "created").slice(0, 6), at: imp.createdAt } : null} />
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="text-[12.5px] text-muted">
            <span className="tnum font-medium text-fg">{list.length}</span> of {all.length} candidates
          </div>
          <form>
            <input name="q" defaultValue={q} className="input h-8 w-64" placeholder="Search name, title, location" />
          </form>
        </div>
        <div className="card mt-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-line bg-subtle/50">
                <tr>
                  <th className="th">Candidate</th>
                  <th className="th">Location</th>
                  <th className="th">Source</th>
                  <th className="th">Status</th>
                  <th className="th">CV updated</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const stale = isDormant(c.updatedAt);
                  return (
                    <tr key={c.id} className="group border-b border-line last:border-0 hover:bg-hover/50">
                      <td className="td">
                        <Link href={`/candidates/${c.id}`} className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pine-soft text-[11px] font-semibold text-pine transition-transform duration-300 group-hover:scale-110" dir="auto">
                            {c.name
                              .split(" ")
                              .map((x) => x[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium group-hover:underline" dir="auto">
                              {c.name}
                            </span>
                            <span className="block truncate text-[12px] text-faint" dir="auto">
                              {c.headline}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="td text-[12.5px] text-muted" dir="auto">
                        {c.location}
                      </td>
                      <td className="td font-mono text-[11.5px] text-faint">{c.source}</td>
                      <td className="td">
                        <div className="flex flex-wrap gap-1">
                          {c.parseStatus !== "ok" && <span className="chip bg-bad-bg text-bad">Parse failed</span>}
                          {stale && <span className="chip bg-subtle text-muted">Dormant</span>}
                          {shortlisted.has(c.id) && <span className="chip bg-lemon-soft text-lemon-text">Shortlisted</span>}
                          {c.language === "he" && <span className="chip bg-subtle text-muted">HE</span>}
                          {c.demo && <DemoTag />}
                        </div>
                      </td>
                      <td className="td text-[12px] text-faint">{ago(c.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Page>
    </>
  );
}
