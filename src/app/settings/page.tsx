import { Page, PageHeader, money, ago } from "@/components/ui";
import { SettingsControls } from "@/components/settings-controls";
import { db } from "@/lib/store";
import { provider, jevAvailable } from "@/lib/providers";
import { llmAvailable } from "@/lib/llm";
import { session } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const d = db();
  const s = await session();
  const byPurpose = d.usage.reduce<Record<string, { calls: number; tokens: number; usd: number }>>((a, u) => {
    a[u.purpose] ??= { calls: 0, tokens: 0, usd: 0 };
    a[u.purpose].calls++;
    a[u.purpose].tokens += u.input + u.output;
    a[u.purpose].usd += u.usd;
    return a;
  }, {});
  return (
    <>
      <PageHeader title="Settings & audit" subtitle="Evaluator, usage and an append-only log of who did what." />
      <Page>
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <SettingsControls isAdmin={s.can("settings")} current={provider().name} jev={jevAvailable()} llm={llmAvailable()} />
            <section className="card p-4">
              <h2 className="text-[14px] font-semibold">Usage</h2>
              <p className="text-[12px] text-faint">Metered per call · list price $42 / 1B tokens (to verify against invoice)</p>
              <table className="mt-3 w-full text-[12.5px]">
                <tbody>
                  {Object.entries(byPurpose).map(([k, v]) => (
                    <tr key={k} className="border-b border-line last:border-0">
                      <td className="py-2 capitalize text-muted">{k.replace("_", " ")}</td>
                      <td className="tnum py-2 text-right">{v.calls}</td>
                      <td className="tnum py-2 text-right text-muted">{(v.tokens / 1000).toFixed(1)}k</td>
                      <td className="tnum py-2 text-right font-medium">{money(v.usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="card p-4 text-[12.5px] leading-5 text-muted">
              <h2 className="mb-2 text-[14px] font-semibold text-fg">Data handling</h2>
              Contact details (email, phone, links) are redacted from evaluator input. Resume text is treated as untrusted data. Deleting a candidate removes text, evidence and derived results. No
              criteria on age, gender, origin or family status; drafts that mention them are flagged.
            </section>
          </div>
          <section className="card overflow-hidden">
            <h2 className="border-b border-line px-4 py-3 text-[14px] font-semibold">Audit log</h2>
            <div className="max-h-[75vh] overflow-y-auto">
              {d.audit.slice(0, 300).map((a) => (
                <div key={a.id} className="grid grid-cols-[150px_1fr] gap-3 border-b border-line px-4 py-2 text-[12.5px] last:border-0 sm:grid-cols-[110px_190px_1fr]">
                  <span className="text-faint">{ago(a.at)}</span>
                  <span className="font-mono text-[11.5px] text-pine">{a.action}</span>
                  <span className="col-span-2 min-w-0 truncate sm:col-span-1">
                    {a.target} {a.detail && <span className="text-faint">· {a.detail}</span>} <span className="text-faint">· {a.actor}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </Page>
    </>
  );
}
