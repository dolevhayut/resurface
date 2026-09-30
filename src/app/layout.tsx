import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Hebrew } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { session } from "@/lib/session";
import { provider } from "@/lib/providers";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const hebrew = Noto_Sans_Hebrew({ variable: "--font-hebrew", subsets: ["hebrew"] });

export const metadata: Metadata = {
  title: "CVLeap — Rediscover your talent",
  description: "Turn your existing candidate database into your next shortlist.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const s = await session();
  const p = provider();
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${hebrew.variable}`}>
      <body className="font-sans">
        <Sidebar role={s.role} name={s.name} provider={p.name === "jev" ? `JEV · ${p.model}` : "Offline heuristic"} />
        <main className="min-h-dvh p-0 md:py-3 md:pr-3 md:pl-[260px]">
          <div className="min-h-dvh overflow-hidden bg-bg md:min-h-[calc(100dvh-24px)] md:rounded-[20px] md:border md:border-line md:shadow-[0_1px_0_rgba(255,255,255,.4)_inset,0_12px_40px_-24px_rgba(21,32,27,.25)]">{children}</div>
        </main>
      </body>
    </html>
  );
}
