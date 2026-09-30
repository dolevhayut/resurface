import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, mono, pop, serif, tween } from "../theme";
import { ResumeCard, Shell } from "./parts";
import { sceneFrames } from "./data";

const COLS = 14;
const ROWS = 16;

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const dur = sceneFrames(0);
  const count = Math.round(interpolate(f, [18, 150], [0, 185000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) }));
  const dormant = tween(f, [150, 200], [0, 1]);
  const glow = pop(f, 205, 16);
  return (
    <Shell dur={dur} grid>
      {/* the wall of resumes */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 610,
          translate: "-50% -50%",
          scale: interpolate(f, [0, dur], [1.18, 0.96]),
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 62px)`,
          gap: 12,
        }}
      >
        {Array.from({ length: COLS * ROWS }).map((_, i) => {
          const r = Math.floor(i / COLS);
          const c = i % COLS;
          const delay = (r + c) * 2.2 + ((i * 37) % 7);
          const special = r === 9 && c === 8;
          return (
            <div
              key={i}
              style={{
                opacity: tween(f, [delay, delay + 12], [0, 1]),
                translate: `0 ${tween(f, [delay, delay + 16], [40, 0])}px`,
                scale: special ? 1 + glow * 0.9 : 1,
                zIndex: special ? 5 : 1,
                position: "relative",
              }}
            >
              <ResumeCard w={62} dim={special ? 0 : dormant} hi={special && glow > 0.2 ? 3 : undefined} tint={special && glow > 0.2 ? C.surface : undefined} />
            </div>
          );
        })}
      </div>
      {/* counter */}
      <div style={{ position: "absolute", left: 90, top: 110 }}>
        <div style={{ fontFamily: mono, fontSize: 30, letterSpacing: 4, color: C.muted, opacity: tween(f, [4, 20], [0, 1]) }}>YOUR ATS · TODAY</div>
        <div style={{ fontSize: 176, fontWeight: 700, letterSpacing: -9, lineHeight: 1, marginTop: 10, fontVariantNumeric: "tabular-nums" }}>{count.toLocaleString("en-US")}</div>
        <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: -2, marginTop: 6 }}>
          resumes.{" "}
          <span style={{ fontFamily: serif, fontWeight: 400, fontStyle: "italic", color: C.muted, opacity: tween(f, [188, 210], [0, 1]) }}>Nobody reads them.</span>
        </div>
      </div>
      {/* the one that matters */}
      <div
        style={{
          position: "absolute",
          left: 610,
          top: 1010,
          opacity: tween(f, [215, 232], [0, 1]),
          translate: `0 ${tween(f, [215, 235], [20, 0])}px`,
          background: C.ink,
          color: C.lemon,
          fontFamily: mono,
          fontSize: 28,
          padding: "12px 20px",
          borderRadius: 14,
        }}
      >
        ← your next hire
      </div>
    </Shell>
  );
};
