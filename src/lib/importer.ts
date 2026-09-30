import "server-only";
import Papa from "papaparse";
import type { Candidate, ImportRecord } from "./types";
import { audit, db, now, save, sha, TENANT, uid } from "./store";

// Import (PRD §5.1, §7 Stage 0): parse once per document version, detect duplicates by
// content hash, version updates by email, and never send empty text to evaluation.

interface Parsed {
  source: string;
  text: string;
  meta?: Partial<Pick<Candidate, "name" | "headline" | "location" | "email">>;
  error?: string;
}

async function extract(file: File): Promise<Parsed[]> {
  const name = file.name;
  const buf = new Uint8Array(await file.arrayBuffer());
  try {
    if (/\.pdf$/i.test(name)) {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(buf);
      const { text } = await extractText(pdf, { mergePages: true });
      return [{ source: name, text: String(text) }];
    }
    if (/\.docx$/i.test(name)) {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
      return [{ source: name, text: value }];
    }
    if (/\.(txt|md)$/i.test(name)) return [{ source: name, text: new TextDecoder().decode(buf) }];
    if (/\.csv$/i.test(name)) {
      const rows = Papa.parse<Record<string, string>>(new TextDecoder().decode(buf), { header: true, skipEmptyLines: true }).data;
      return rows.map((r, i) => ({
        source: `${name}#${i + 2}`,
        text: r.resume_text || r.text || r.cv || "",
        meta: { name: r.name, headline: r.headline, location: r.location, email: r.email },
      }));
    }
    return [{ source: name, text: "", error: "Unsupported file type (use PDF, DOCX, TXT or CSV)" }];
  } catch (e) {
    return [{ source: name, text: "", error: `Could not read file: ${(e as Error).message}` }];
  }
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;

export async function importFiles(files: File[], actor: string): Promise<ImportRecord> {
  const d = db();
  const rec: ImportRecord = { id: uid("imp"), tenantId: TENANT, createdAt: now(), createdBy: actor, files: 0, created: 0, updated: 0, duplicates: 0, failed: 0, items: [] };
  const parsed = (await Promise.all(files.map(extract))).flat();
  for (const p of parsed) {
    rec.files++;
    const text = p.text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
    const lines = text.split("\n").map((t) => t.trim()).filter(Boolean).map((t, i) => ({ id: `L${String(i).padStart(3, "0")}`, text: t }));
    if (p.error || lines.length < 3) {
      rec.failed++;
      rec.items.push({ source: p.source, status: "failed", message: p.error ?? "No extractable text (scanned or empty) — queued for OCR review" });
      continue;
    }
    const hash = sha(text);
    const email = p.meta?.email || text.match(EMAIL)?.[0];
    const dup = d.candidates.find((c) => c.tenantId === TENANT && !c.deletedAt && c.contentHash === hash);
    if (dup) {
      rec.duplicates++;
      rec.items.push({ source: p.source, status: "duplicate", candidateId: dup.id, message: `Same content as ${dup.source}` });
      continue;
    }
    const same = email ? d.candidates.find((c) => c.tenantId === TENANT && !c.deletedAt && c.email === email) : undefined;
    const language = /[֐-׿]/.test(text) ? "he" : "en";
    if (same) {
      Object.assign(same, { lines, contentHash: hash, version: same.version + 1, updatedAt: now(), source: p.source, importId: rec.id, language, parseStatus: "ok", parseError: undefined });
      rec.updated++;
      rec.items.push({ source: p.source, status: "updated", candidateId: same.id, message: `New resume version v${same.version}` });
      continue;
    }
    const c: Candidate = {
      id: uid("cand"),
      tenantId: TENANT,
      name: p.meta?.name || lines[0].text.slice(0, 60),
      headline: p.meta?.headline || lines[1]?.text.slice(0, 80) || "",
      location: p.meta?.location || "",
      email,
      version: 1,
      contentHash: hash,
      lines,
      language,
      parseStatus: "ok",
      source: p.source,
      importId: rec.id,
      updatedAt: now(),
      createdAt: now(),
      demo: false,
    };
    d.candidates.push(c);
    rec.created++;
    rec.items.push({ source: p.source, status: "created", candidateId: c.id });
  }
  d.imports.unshift(rec);
  audit(actor, "import.completed", rec.id, `${rec.files} files · ${rec.created} created · ${rec.updated} updated · ${rec.duplicates} duplicates · ${rec.failed} failed`);
  save();
  return rec;
}
