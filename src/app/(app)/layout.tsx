import { Sidebar } from "@/components/sidebar";
import { DemoGuide } from "@/components/demo-guide";
import { session } from "@/lib/session";
import { provider } from "@/lib/providers";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const s = await session();
  const p = provider();
  return (
    <>
      <Sidebar role={s.role} name={s.name} provider={p.name === "jev" ? `JEV · ${p.model}` : "Offline heuristic"} />
      <main className="min-h-dvh p-0 md:py-3 md:pr-3 md:pl-[260px]">
        <div className="min-h-dvh overflow-hidden bg-bg md:min-h-[calc(100dvh-24px)] md:rounded-[20px] md:border md:border-line md:shadow-[0_1px_0_rgba(255,255,255,.4)_inset,0_12px_40px_-24px_rgba(21,32,27,.25)]">{children}</div>
      </main>
      <DemoGuide />
    </>
  );
}
