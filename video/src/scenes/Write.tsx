import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, mono, pop, sans, serif, tween } from "../theme";
import { Shell } from "./parts";
import { sceneFrames } from "./data";

const PROSE =
  "Based on the resume, the candidate appears to have solid React experience. They mention building dashboards and a Next.js client, which suggests hands-on work, although the depth is hard to judge. Their backend exposure seems to include Node.js services; however, it is not entirely clear whether they owned these systems in production or contributed to them as part of a larger team. Overall, the candidate could potentially be a reasonable fit, depending on…";

export const Write: React.FC = () => {
  const f = useCurrentFrame();
  const dur = sceneFrames(1);
  const chars = Math.floor(interpolate(f, [10, dur - 6], [0, PROSE.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const tokens = Math.round(chars * 1.35);
  const cost = (tokens * 10) / 1e6 + (f > 10 ? 0.0021 : 0);
  return (
    <Shell dur={dur} bg={C.night}>
      <div style={{ position: "absolute", left: 90, top: 120, color: "#ecefe9" }}>
        <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -6, lineHeight: 0.95, opacity: tween(f, [0, 12], [0, 1]), translate: `0 ${tween(f, [0, 16], [30, 0])}px` }}>Language models</div>
        <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 150, lineHeight: 1, color: "#aee2c6", opacity: tween(f, [8, 22], [0, 1]), translate: `0 ${tween(f, [8, 26], [30, 0])}px` }}>write.</div>
      </div>
      {/* streaming "LLM" output */}
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 470,
          height: 470,
          borderRadius: 28,
          border: `1px solid ${C.nightLine}`,
          background: "#121916",
          padding: 36,
          overflow: "hidden",
          opacity: tween(f, [14, 28], [0, 1]),
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 22, letterSpacing: 3, color: "#6d7872", marginBottom: 18 }}>GENERAL LLM · STREAMING</div>
        <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 40, lineHeight: 1.35, color: "#cfd6d1" }}>
          {PROSE.slice(0, chars)}
          <span style={{ display: "inline-block", width: 3, height: 38, background: "#aee2c6", marginLeft: 4, translate: "0 6px", opacity: Math.floor(f / 8) % 2 ? 1 : 0.2 }} />
        </div>
      </div>
      {/* meters */}
      <div style={{ position: "absolute", left: 90, right: 90, top: 975, display: "flex", gap: 20, fontFamily: sans }}>
        {[
          { k: "tokens", v: tokens.toLocaleString("en-US"), c: "#ecefe9" },
          { k: "time / resume", v: `${Math.min(2.5, f / 30 / 2.3).toFixed(1)} s`, c: "#ecefe9" },
          { k: "cost", v: `$${cost.toFixed(4)}`, c: f > 150 ? "#f3a19b" : "#ecefe9" },
        ].map((m, i) => (
          <div key={m.k} style={{ flex: 1, borderRadius: 22, background: "#121916", border: `1px solid ${C.nightLine}`, padding: "20px 24px", scale: i === 2 && f > 150 ? 1 + 0.05 * pop(f, 150, 10) : 1 }}>
            <div style={{ fontFamily: mono, fontSize: 22, color: "#6d7872", letterSpacing: 2 }}>{m.k.toUpperCase()}</div>
            <div style={{ fontSize: 50, fontWeight: 600, color: m.c, fontVariantNumeric: "tabular-nums", letterSpacing: -1 }}>{m.v}</div>
          </div>
        ))}
      </div>
      {/* kinetic words in sync with "Beautifully. Slowly." */}
      {[
        { t: "Beautifully.", at: 38, x: 470, y: 300 },
        { t: "Slowly.", at: 72, x: 800, y: 372 },
      ].map((w) => (
        <div
          key={w.t}
          style={{
            position: "absolute",
            left: w.x,
            top: w.y,
            fontFamily: serif,
            fontStyle: "italic",
            fontSize: 64,
            color: C.lemon,
            opacity: tween(f, [w.at, w.at + 8], [0, 1]),
            rotate: `${-6 + pop(f, w.at, 12) * 3}deg`,
            scale: 0.6 + 0.4 * pop(f, w.at, 12),
          }}
        >
          {w.t}
        </div>
      ))}
    </Shell>
  );
};
