"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { motion } from "motion/react";
import { Icon, type IconName } from "./icons";
import { AnimatedBackground, spring } from "./motion";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Overview", icon: "overview" },
  { href: "/ask", label: "Ask the pool", icon: "ask" },
  { href: "/jobs", label: "Jobs & matches", icon: "jobs" },
  { href: "/candidates", label: "Candidates", icon: "candidates" },
  { href: "/shortlists", label: "Shortlists", icon: "shortlists" },
  { href: "/settings", label: "Settings & audit", icon: "settings" },
];

export function Logo() {
  return (
    <span className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em]">
      <motion.span whileHover={{ rotate: -8, scale: 1.06 }} transition={spring} className="grid size-7 place-items-center rounded-[9px] bg-pine text-on-pine shadow-[inset_0_1px_0_rgba(255,255,255,.25)]">
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 12 6.5 4.5l2.3 4.2L10.6 6.5 13.5 12" />
          <circle cx="11.2" cy="3.2" r="1.35" fill="var(--lemon)" stroke="none" />
        </svg>
      </motion.span>
      CVLeap
    </span>
  );
}

export function Sidebar({ role, name, provider }: { role: string; name: string; provider: string }) {
  const path = usePathname();
  const router = useRouter();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href) || (href === "/jobs" && path.startsWith("/runs")));
  const active = NAV.find((n) => isActive(n.href))?.href ?? null;
  async function setRole(r: string) {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: r }) });
    router.refresh();
  }
  return (
    <>
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed bottom-3 left-3 top-3 z-30 hidden w-[232px] flex-col rounded-[20px] border border-line bg-surface/90 p-3 shadow-[0_12px_40px_-20px_rgba(21,32,27,.35)] backdrop-blur-xl md:flex"
      >
        <div className="px-2 pb-6 pt-1.5">
          <Logo />
        </div>
        <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Workspace</div>
        <nav className="flex flex-col gap-0.5">
          <AnimatedBackground value={active} className="rounded-xl bg-pine-soft" transition={spring}>
            {NAV.map(({ href, label, icon }) => (
              <Link
                key={href}
                data-id={href}
                href={href}
                className={clsx("group flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-[13px] transition-colors", isActive(href) ? "font-medium text-pine" : "text-muted hover:text-fg")}
              >
                <motion.span whileHover={{ scale: 1.15, rotate: -6 }} transition={spring} className="grid place-items-center">
                  <Icon name={icon} weight={isActive(href) ? "duotone" : "regular"} className="size-[18px]" />
                </motion.span>
                {label}
              </Link>
            ))}
          </AnimatedBackground>
        </nav>
        <div className="mt-auto space-y-2.5">
          <div className="grain rounded-2xl border border-line bg-subtle/60 p-3">
            <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <span className="relative flex size-2">
                <span className={clsx("absolute inline-flex size-full animate-ping rounded-full opacity-60", provider.startsWith("JEV") ? "bg-ok" : "bg-warn")} />
                <span className={clsx("relative inline-flex size-2 rounded-full", provider.startsWith("JEV") ? "bg-ok" : "bg-warn")} />
              </span>
              Evaluator online
            </div>
            <div className="mt-1 truncate font-mono text-[11.5px]">{provider}</div>
          </div>
          <label className="relative block">
            <span className="sr-only">Acting as</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-line bg-surface pl-3 pr-8 text-[12.5px] outline-none transition-colors hover:bg-hover"
            >
              <option value="recruiter">Rin · Recruiter</option>
              <option value="admin">Avery · Org admin</option>
              <option value="hiring_manager">Harper · Hiring manager</option>
            </select>
            <Icon name="updown" className="pointer-events-none absolute right-2.5 top-3 size-3.5 text-faint" />
          </label>
          <p className="px-1 text-[10.5px] leading-4 text-faint">Demo workspace · fictional people & companies · {name.split(" ")[0]}</p>
        </div>
      </motion.aside>
      <div className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl border border-line bg-surface/90 p-1 shadow-[var(--shadow)] backdrop-blur-xl md:hidden">
        <AnimatedBackground value={active} className="rounded-xl bg-pine-soft">
          {NAV.slice(0, 5).map(({ href, label, icon }) => (
            <Link key={href} data-id={href} href={href} aria-label={label} className={clsx("grid size-11 place-items-center rounded-xl", isActive(href) ? "text-pine" : "text-muted")}>
              <Icon name={icon} weight={isActive(href) ? "duotone" : "regular"} className="size-5" />
            </Link>
          ))}
        </AnimatedBackground>
      </div>
    </>
  );
}
