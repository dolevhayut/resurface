import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Hebrew, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const hebrew = Noto_Sans_Hebrew({ variable: "--font-hebrew", subsets: ["hebrew"] });
const serif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Resurface — Rediscover your talent",
  description: "Turn your existing candidate database into your next shortlist.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${hebrew.variable} ${serif.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
