import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, mono, pop, serif, tween } from "../theme";
import { Shell } from "./parts";
import { sceneFrames } from "./data";

// Measured: JEV 0.29 s / $0.00018 per resume · Sonnet 5.5 2.5 s / $0.0057 (scripts/benchmark.mts)
const Lane: React.FC<{ label: string; sub: string; progress: number; color: string; done: number }> = ({ label, sub, progress, color, done }) => (
  <div style={{ marginTop: 34 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>{label}</div>
      <div style={{ fontFamily: mono, fontSize: 26, color: C.muted }}>{sub}</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(25, 1fr)", gap: 6, marginTop: 14 }}>
      {Array.from({ length: 100 }).map((_, i) => (
        <div key={i} style={{ aspectRatio: "1", borderRadius: 5, background: i < done ? color : "#e7e6dd", scale: i < done ? 1 : 0.9 }} />
      ))}
    </div>
    <div style={{ fontFamily: mono, fontSize: 24, color: C.faint, marginTop: 10 }}>{Math.round(progress * 100)} / 100 resumes</div>
  </div>
);

export const Race: React.FC = () => {
  const f = useCurrentFrame();
  const dur = sceneFrames(4);
  const jev = interpolate(f, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const llm = interpolate(f, [10, 40 * 8.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Shell dur={dur}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 100 }}>
        <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: 3, color: C.muted, opacity: tween(f, [0, 10], [0, 1]) }}>SAME RESUMES · SAME QUESTIONS · MEASURED</div>
        <Lane label="Claude Sonnet 5.5" sub="2.5 s · $0.0057 / resume" progress={llm} color={C.gold} done={Math.floor(llm * 100)} />
        <Lane label="TypeSafe Jev" sub="0.29 s · $0.00018 / resume" progress={jev} color={C.pine} done={Math.floor(jev * 100)} />
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 870, display: "flex", gap: 30 }}>
        {[
          { n: "8×", l: "faster", at: 80 },
          { n: "31×", l: "cheaper", at: 128 },
        ].map((s) => (
          <div
            key={s.n}
            style={{
              flex: 1,
              borderRadius: 32,
              background: C.pine,
              color: C.surface,
              padding: "26px 34px",
              opacity: tween(f, [s.at, s.at + 6], [0, 1]),
              scale: 0.6 + 0.4 * pop(f, s.at, 14),
              rotate: `${(1 - pop(f, s.at, 14)) * -4}deg`,
            }}
          >
            <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -8, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 60, color: C.lemon }}>{s.l}</div>
          </div>
        ))}
      </div>
    </Shell>
  );
};
