import { PageHeader, Page } from "@/components/ui";
import { AskPool } from "@/components/ask-pool";
import { session } from "@/lib/session";
import { candidatesOf } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Ask() {
  const s = await session();
  return (
    <>
      <PageHeader title="Ask the pool" subtitle="Describe who you need in plain language — not keywords. Every readable resume is judged against your request, with the line that supports it." />
      <Page>
        <AskPool canQuery={s.can("query")} poolSize={candidatesOf().filter((c) => c.parseStatus === "ok").length} />
      </Page>
    </>
  );
}
