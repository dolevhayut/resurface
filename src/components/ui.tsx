import clsx from "clsx";
import type { EvidenceStatus } from "@/lib/types";
import type { Group } from "@/lib/scoring";
import { Icon, type IconName } from "./icons";
import { AnimatedNumber } from "./motion";

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-4 pb-5 pt-6 md:px-8 md:pt-8">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-[12px] text-muted">{eyebrow}</div>}
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[13px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("mx-auto max-w-[1440px] px-4 py-6 pb-24 md:px-8 md:pb-10", className)}>{children}</div>;
}

export function Stat({ label, value, hint, accent }: { label: string; value: React.ReactNode; hint?: React.ReactNode; accent?: boolean }) {
  return (
    <div className={clsx("card group relative overflow-hidden p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow)]", accent && "border-transparent bg-pine text-on-pine")}>
      {accent && <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-lemon/30 blur-2xl transition-transform duration-500 group-hover:scale-125" />}
      <div className={clsx("text-[12px]", accent ? "opacity-80" : "text-muted")}>{label}</div>
      <div className="tnum mt-1 text-[28px] font-semibold tracking-[-0.035em]">{typeof value === "number" ? <AnimatedNumber value={value} /> : value}</div>
      {hint && <div className={clsx("mt-0.5 text-[12px]", accent ? "opacity-80" : "text-faint")}>{hint}</div>}
    </div>
  );
}

const EV: Record<EvidenceStatus | "pending", { label: string; cls: string; icon: IconName }> = {
  supported: { label: "Supported", cls: "bg-ok-bg text-ok", icon: "supported" },
  contradicted: { label: "Contradicted", cls: "bg-bad-bg text-bad", icon: "contradicted" },
  not_established: { label: "Not established", cls: "bg-subtle text-muted", icon: "unknown" },
  needs_verification: { label: "Needs verification", cls: "bg-warn-bg text-warn", icon: "warning" },
  pending: { label: "Pending", cls: "bg-subtle text-faint", icon: "pending" },
};

export function EvidenceBadge({ status, compact }: { status: EvidenceStatus | "pending"; compact?: boolean }) {
  const { label, cls, icon } = EV[status];
  return (
    <span className={clsx("chip transition-colors duration-300", cls)} title={label}>
      <Icon name={icon} className="size-3" />
      {!compact && label}
    </span>
  );
}

const GR: Record<Group, string> = {
  strong: "bg-ok-bg text-ok",
  verify: "bg-warn-bg text-warn",
  lower: "bg-subtle text-muted",
  not_evaluated: "bg-bad-bg text-bad",
};
const GL: Record<Group, string> = { strong: "Strong evidence", verify: "Needs verification", lower: "Lower evidence match", not_evaluated: "Not evaluated" };

export function GroupBadge({ group }: { group: Group }) {
  return <span className={clsx("chip", GR[group])}>{GL[group]}</span>;
}

export function Meter({ value, className, tone = "pine" }: { value: number; className?: string; tone?: "pine" | "lemon" | "muted" }) {
  return (
    <div className={clsx("h-1.5 overflow-hidden rounded-full bg-subtle", className)}>
      <div
        className={clsx("h-full rounded-full transition-[width] duration-300", tone === "pine" ? "bg-pine" : tone === "lemon" ? "bg-lemon" : "bg-faint")}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

/** Match range bar: solid = known lower bound, hatched = could still be earned (unknowns). */
export function RangeBar({ lower, upper }: { lower: number; upper: number }) {
  return (
    <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-subtle" title={`Possible range ${Math.round(lower * 100)}–${Math.round(upper * 100)}`}>
      <div className="absolute inset-y-0 left-0 rounded-full bg-lemon/70" style={{ width: `${upper * 100}%` }} />
      <div className="absolute inset-y-0 left-0 rounded-full bg-pine" style={{ width: `${lower * 100}%` }} />
    </div>
  );
}

export function DemoTag() {
  return <span className="chip bg-lemon-soft text-lemon-text">Demo data</span>;
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-14 text-center">
      <div className="text-[14px] font-medium">{title}</div>
      {body && <p className="mt-1 max-w-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}`);
export const money = (v: number) => (v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`);
export const ago = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 86400 * 60) return `${Math.floor(d / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};
export const tokens = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));
