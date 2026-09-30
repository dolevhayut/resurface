import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, mono, serif, tween } from "../theme";
import { Shell } from "./parts";
import { sceneFrames } from "./data";

// Measured: 99% of question-level verdicts identical to Claude Sonnet 5.5.
export const Agree: React.FC = () => {
  const f = useCurrentFrame();
  const dur = sceneFrames(5);
  const pct = Math.round(interpolate(f, [4, 70], [0, 99], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) }));
  return (
    <Shell dur={dur} grid>
      <div style={{ position: "absolute", left: 90, right: 90, top: 110 }}>
        <div style={{ fontSize: 240, fontWeight: 700, letterSpacing: -14, lineHeight: 0.9, color: C.pine, fontVariantNumeric: "tabular-nums" }}>{pct}%</div>
        <div style={{ fontSize: 60, fontWeight: 600, letterSpacing: -2, marginTop: 10 }}>
          the same verdicts as a <span style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 400 }}>frontier LLM.</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 24, color: C.faint, marginTop: 14 }}>vs Claude Sonnet 5.5 · 20 resumes × 5 questions</div>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 640, display: "grid", gridTemplateColumns: "repeat(20, 1fr)", gap: 10 }}>
        {Array.from({ length: 100 }).map((_, i) => {
          const at = 6 + i * 0.6;
          const odd = i === 73;
          return (
            <div
              key={i}
              style={{
                aspectRatio: "1",
                borderRadius: 7,
                background: odd ? C.bad : C.pine,
                opacity: tween(f, [at, at + 6], [0, 1]),
                scale: tween(f, [at, at + 10], [0.3, 1]),
              }}
            />
          );
        })}
      </div>
    </Shell>
  );
};
