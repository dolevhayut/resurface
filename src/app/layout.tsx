import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Hebrew, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const hebrew = Noto_Sans_Hebrew({ variable: "--font-hebrew", subsets: ["hebrew"] });
const serif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "Resurface — Language models write. Classification models decide.",
  description:
    "Open-source resume screening with TypeSafe JEV: an LLM writes the screening questions once, a classification model answers them for every resume in your ATS — with the exact line that proves it. 8× faster and 31× cheaper than an LLM, 99% the same verdicts.",
  keywords: [
    "JEV", "TypeSafe JEV", "TypeSafe", "System One", "jev-latest", "classification model", "decision model", "LLM vs classifier",
    "resume screening", "candidate matching", "talent rediscovery", "ATS", "applicant tracking system", "recruiting AI", "HR tech",
    "OpenAI Decisions API", "Claude", "evidence-based hiring", "semantic search", "Next.js",
  ],
  openGraph: { type: "website", siteName: "Resurface", title: "Language models write. Classification models decide.", description: "Turn a dormant candidate database into evidence-backed shortlists with TypeSafe JEV." },
  twitter: { card: "summary_large_image", title: "Language models write. Classification models decide.", description: "Open-source resume screening with TypeSafe JEV." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${hebrew.variable} ${serif.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
