"use client";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Icon } from "./icons";

// Guided demo: a narrated walkthrough of the pitch. Each step can navigate, spotlight a
// [data-tour] element, and run a real action ("Do it for me") through /api/demo.

type Lang = "he" | "en";
type Step = {
  id: string;
  route?: string; // static route
  resolve?: string; // /api/demo action that returns the route
  target?: string; // data-tour id to spotlight
  action?: { api: string; label: Record<Lang, string> };
  title: Record<Lang, string>;
  body: Record<Lang, string>;
};

const ASK = "An engineer who has owned production systems on-call, even if their title isn't DevOps";

const STEPS: Step[] = [
  {
    id: "intro",
    route: "/",
    target: "hero",
    title: { he: "המאגר הרדום שלכם", en: "Your dormant database" },
    body: {
      he: "לכל ארגון יש אלפי קורות חיים שנאספו לאורך שנים — ואף אחד לא באמת מחפש בהם. CVLeap יושב מעל ה־ATS הקיים והופך את המאגר הזה לרשימות התאמה מבוססות ראיות.",
      en: "Every company has thousands of resumes collected over years — and nobody really searches them. CVLeap sits on top of the existing ATS and turns that pool into evidence-backed shortlists.",
    },
  },
  {
    id: "stats",
    route: "/",
    target: "stats",
    title: { he: "מה יש לנו במאגר", en: "What’s in the pool" },
    body: {
      he: "100 קורות חיים לדמו (בדויים), 20 משרות פתוחות. רובם לא עודכנו שנתיים — בדיוק הקבצים שחיפוש מילות מפתח מפספס. הייבוא כבר זיהה כפילות וקובץ סרוק שלא ניתן לקרוא.",
      en: "100 demo resumes (fictional) and 20 open jobs. Most weren’t updated in two years — exactly what keyword search misses. Import already caught a duplicate and an unreadable scan.",
    },
  },
  {
    id: "live-job",
    route: "/jobs/job_20",
    target: "draft",
    action: { api: "draft_live", label: { he: "צור שאלות עכשיו", en: "Generate questions" } },
    title: { he: "משרה חדשה, בלי מועמדים", en: "A new job, zero candidates" },
    body: {
      he: "הנה משרת Solutions Engineer שעוד אין לה אף מועמד. לחיצה אחת: המערכת קוראת את תיאור המשרה וגוזרת 6–8 שאלות סינון אטומיות — כל אחת בודקת דבר אחד.",
      en: "Here’s a Solutions Engineer job with no candidates yet. One click: the system reads the job description and derives 6–8 atomic screening questions — each checks one thing.",
    },
  },
  {
    id: "live-questions",
    route: "/jobs/job_20",
    target: "criteria",
    action: { api: "run_live", label: { he: "שלח 10 קו״ח ל־JEV", en: "Send 10 resumes to JEV" } },
    title: { he: "השאלות — מעוגנות במודעה", en: "Questions — anchored to the posting" },
    body: {
      he: "כל שאלה קשורה לשורה אמיתית בתיאור המשרה (מסומן בצהוב) — אין דרישות מומצאות. המגייס יכול לערוך חובה/יתרון ומשקלים. עכשיו נשלח 10 קורות חיים ל־JEV.",
      en: "Every question is tied to a real line of the posting (highlighted) — no invented requirements. The recruiter can edit must/nice and weights. Now let’s send 10 resumes to JEV.",
    },
  },
  {
    id: "live-results",
    resolve: "latest_live_run",
    target: "results",
    title: { he: "התאמות בלייב — ציון לכל מועמד", en: "Live matches — a score per candidate" },
    body: {
      he: "כל קובץ נשלח ל־JEV יחד עם השאלות, ובחזרה: נתמך / סותר / לא הוכח לכל שאלה, והשורה המדויקת שמוכיחה. הציון = משקל השאלות שהוכחו בציטוט. המועמדים מתמיינים תוך כדי.",
      en: "Each resume goes to JEV with the questions and comes back with supported / contradicted / not established per question, plus the exact proving line. Score = weight of questions proven by a quote. Candidates re-sort as they land.",
    },
  },
  {
    id: "drawer",
    resolve: "open_top",
    target: "drawer",
    title: { he: "ראיות, לא ניחושים", en: "Evidence, not guesses" },
    body: {
      he: "לכל תשובה — ציטוט מדויק מקורות החיים. לחיצה על הציטוט קופצת לשורה במקור. מה שלא הוכח הופך אוטומטית לשאלה לראיון. אי אפשר ״להמציא״ ציטוט: JEV בוחר שורה קיימת.",
      en: "Every answer comes with an exact quote. Click it to jump to the source line. Anything not established becomes an interview check. Quotes can’t be invented: JEV selects an existing line.",
    },
  },
  {
    id: "ask",
    route: `/ask?q=${encodeURIComponent(ASK)}`,
    target: "ask",
    title: { he: "לשאול את המאגר בשפה חופשית", en: "Ask the pool in plain language" },
    body: {
      he: "״מהנדס שהחזיק מערכות production בתורנות, גם אם התואר שלו לא DevOps״ — חיפוש מילות מפתח לא יודע לעשות את זה. כאן כל קובץ נקרא, וחוזרת השורה שמצדיקה את ההתאמה.",
      en: "“An engineer who owned production on-call, even if not titled DevOps” — keyword search can’t do this. Here every resume is read, and the justifying line comes back.",
    },
  },
  {
    id: "reverse",
    resolve: "reverse",
    target: "reverse",
    title: { he: "חיפוש הפוך", en: "Reverse search" },
    body: {
      he: "קיבלתם קו״ח מעולים? בלחיצה אחת — לאיזו משרה פתוחה האדם הזה הכי מתאים, עם אותן שאלות בדיוק.",
      en: "Got a great resume? One click shows which open role this person fits best — using the exact same questions.",
    },
  },
  {
    id: "all",
    route: "/jobs",
    target: "run-all",
    action: { api: "run_all", label: { he: "הרץ את כל 20 המשרות", en: "Run all 20 jobs" } },
    title: { he: "הרגע של הקסם", en: "The magic moment" },
    body: {
      he: "כל 20 המשרות מול כל המאגר — במקביל. כ־2,000 הערכות, פחות מדקה, פחות מדולר. פתאום לכל משרה יש מועמדים חדשים מתוך מה שכבר היה אצלכם.",
      en: "All 20 jobs against the whole pool — in parallel. ~2,000 evaluations, under a minute, under a dollar. Suddenly every job has new candidates from what you already had.",
    },
  },
  {
    id: "end",
    route: "/",
    target: "stats",
    title: { he: "שמרו את ה־ATS. גלו מחדש את הכישרונות.", en: "Keep your ATS. Rediscover your talent." },
    body: {
      he: "המגייס נשאר בשליטה: אין פנייה אוטומטית ואין דחייה אוטומטית. רק רשימה ממוקדת עם ראיות — ופערים לבדוק.",
      en: "The recruiter stays in control: no automatic outreach, no automatic rejection. Just a focused shortlist with evidence — and gaps to verify.",
    },
  },
];

const KEY = "cvleap-demo";
type State = { active: boolean; step: number; lang: Lang };

function load(): State {
  try {
    return { active: false, step: 0, lang: "he", ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { active: false, step: 0, lang: "he" };
  }
}

export function startDemo() {
  window.dispatchEvent(new CustomEvent("cvleap:demo", { detail: "start" }));
}

export function DemoGuide() {
  const router = useRouter();
  const path = usePathname();
  const [st, setSt] = useState<State>({ active: false, step: 0, lang: "he" });
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);

  const persist = useCallback((s: State) => {
    setSt(s);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }, []);

  useEffect(() => {
    const s = load();
    const onEvt = () => persist({ ...load(), active: true, step: 0 });
    window.addEventListener("cvleap:demo", onEvt);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted demo state after mount
    setSt(s);
    setReady(true);
    return () => window.removeEventListener("cvleap:demo", onEvt);
  }, [persist]);

  const step = STEPS[st.step];

  const go = useCallback(
    async (i: number) => {
      const s = STEPS[i];
      if (!s) return;
      setErr("");
      persist({ ...st, active: true, step: i });
      let url = s.route;
      if (s.resolve) {
        setBusy(true);
        const r = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: s.resolve }) });
        const j = await r.json();
        setBusy(false);
        if (!r.ok) return setErr(j.error);
        url = j.url;
      }
      if (url && url !== path + (typeof window !== "undefined" ? window.location.search : "")) router.push(url);
    },
    [st, persist, path, router],
  );

  const doAction = async () => {
    if (!step.action) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: step.action.api }) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error);
    persist({ ...st, step: Math.min(st.step + 1, STEPS.length - 1) });
    router.push(j.url);
    router.refresh();
  };

  // Spotlight tracking: follow the target through navigation, async render and scroll.
  useLayoutEffect(() => {
    if (!st.active || !step?.target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the spotlight when there is no target
      setRect(null);
      return;
    }
    let scrolled = false;
    const tick = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (!el) return setRect(null);
      if (!scrolled) {
        scrolled = true;
        const r0 = el.getBoundingClientRect();
        if (r0.top < 0 || r0.bottom > window.innerHeight - 200) el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      const r = el.getBoundingClientRect();
      setRect((prev) => (prev && Math.abs(prev.x - r.x) < 0.5 && Math.abs(prev.y - r.y) < 0.5 && Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5 ? prev : r));
    };
    tick();
    const t = setInterval(tick, 120);
    return () => clearInterval(t);
  }, [st.active, step?.target, path]);

  useEffect(() => {
    if (!st.active) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select")) return;
      if (e.key === "Escape") persist({ ...st, active: false });
      const fwd = st.lang === "he" ? "ArrowLeft" : "ArrowRight";
      const back = st.lang === "he" ? "ArrowRight" : "ArrowLeft";
      if (e.key === fwd && st.step < STEPS.length - 1) go(st.step + 1);
      if (e.key === back && st.step > 0) go(st.step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [st, go, persist]);

  if (!ready) return null;
  const he = st.lang === "he";
  const pad = 8;

  return (
    <>
      <AnimatePresence>
        {st.active && rect && (
          <motion.div
            key="spot"
            aria-hidden
            className="pointer-events-none fixed z-[60] rounded-2xl ring-2 ring-lemon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            style={{ boxShadow: "0 0 0 9999px rgba(8, 12, 10, 0.42), 0 0 40px 4px color-mix(in oklab, var(--lemon) 45%, transparent)" }}
          >
            <motion.span className="absolute -inset-1 rounded-[18px] ring-1 ring-lemon/60" animate={{ opacity: [0.9, 0, 0.9], scale: [1, 1.02, 1] }} transition={{ duration: 2.2, repeat: Infinity }} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {st.active && step && (
          <motion.div
            key="card"
            dir={he ? "rtl" : "ltr"}
            lang={he ? "he" : "en"}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={clsx("fixed bottom-20 left-1/2 z-[70] w-[min(460px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-[22px] border border-line bg-surface/95 shadow-[0_24px_80px_-20px_rgba(0,0,0,.5)] backdrop-blur-xl md:bottom-6 md:translate-x-0", step.target === "drawer" ? "md:left-[260px]" : "md:left-auto md:right-6")}
          >
            <div className="h-1 bg-subtle">
              <motion.div className="h-full bg-lemon" animate={{ width: `${((st.step + 1) / STEPS.length) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 30 }} />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="chip bg-pine-soft text-pine">
                  <Icon name="play" weight="fill" className="size-3" />
                  {he ? "דמו מודרך" : "Guided demo"} · {st.step + 1}/{STEPS.length}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => persist({ ...st, lang: he ? "en" : "he" })} className="btn-ghost h-7 px-2 text-[12px]" aria-label="Switch language">
                    {he ? "EN" : "עב"}
                  </button>
                  <button onClick={() => persist({ ...st, active: false })} className="btn-ghost size-7 justify-center px-0" aria-label="Close demo">
                    <Icon name="close" className="size-3.5" />
                  </button>
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={step.id + st.lang} initial={{ opacity: 0, x: he ? -12 : 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: he ? 12 : -12 }} transition={{ duration: 0.18 }}>
                  <h3 className="mt-3 text-[17px] font-semibold tracking-tight">{step.title[st.lang]}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-6 text-muted">{step.body[st.lang]}</p>
                </motion.div>
              </AnimatePresence>
              {err && <p className="mt-2 text-[12px] text-bad">{err}</p>}
              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {STEPS.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => go(i)}
                      aria-label={`Step ${i + 1}`}
                      className={clsx("h-1.5 rounded-full transition-all duration-300", i === st.step ? "w-5 bg-pine" : i < st.step ? "w-1.5 bg-pine/50" : "w-1.5 bg-control")}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {st.step > 0 && (
                    <button className="btn-ghost" onClick={() => go(st.step - 1)} disabled={busy}>
                      {he ? "הקודם" : "Back"}
                    </button>
                  )}
                  {step.action ? (
                    <motion.button whileTap={{ scale: 0.95 }} className="btn-primary relative overflow-hidden" onClick={doAction} disabled={busy}>
                      {busy && <span className="shimmer absolute inset-0" />}
                      <Icon name="bolt" weight="fill" className="size-3.5 text-lemon" /> {busy && step.action.api === "draft_live" ? (he ? "קורא את המשרה…" : "Reading the job…") : step.action.label[st.lang]}
                    </motion.button>
                  ) : null}
                  {st.step < STEPS.length - 1 ? (
                    <motion.button whileTap={{ scale: 0.95 }} className={step.action ? "btn-secondary" : "btn-primary"} onClick={() => go(st.step + 1)} disabled={busy}>
                      {step.action ? (he ? "דלג" : "Skip") : he ? "הבא" : "Next"}
                      <Icon name="arrowRight" className={clsx("size-3.5", he && "rotate-180")} />
                    </motion.button>
                  ) : (
                    <button className="btn-primary" onClick={() => persist({ ...st, active: false, step: 0 })}>
                      {he ? "סיום" : "Finish"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
