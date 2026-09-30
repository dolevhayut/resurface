import React from "react";
import { useCurrentFrame } from "remotion";
import { C, mono, pop, serif, tween } from "../theme";
import { Shell } from "./parts";
import { sceneFrames } from "./data";

// OpenAI announced a Decisions API (GPT-6 Luna, limited preview) on 29 Sep 2026.
export const OpenAI: React.FC = () => {
  const f = useCurrentFrame();
  const dur = sceneFrames(6);
  const stamp = pop(f, 106, 12);
  const confetti = Array.from({ length: 36 });
  return (
    <Shell dur={dur}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 110, opacity: tween(f, [0, 12], [0, 1]) }}>
        <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: 3, color: C.muted }}>BREAKING · 29 SEP 2026</div>
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -4, lineHeight: 1, marginTop: 14 }}>
          OpenAI launches a <span style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 400 }}>Decisions API.</span>
        </div>
      </div>
      {/* the membership card */}
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 470,
          borderRadius: 36,
          background: C.ink,
          color: "#ecefe9",
          padding: 48,
          boxShadow: "0 50px 100px -50px rgba(19,32,26,.8)",
          rotate: `${tween(f, [40, 70], [6, -2])}deg`,
          translate: `0 ${tween(f, [40, 70], [300, 0])}px`,
          opacity: tween(f, [40, 52], [0, 1]),
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 24, letterSpacing: 4, color: C.lemon }}>DECISION MODELS CLUB</div>
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 22 }}>
          {[
            { n: "Member Nº 1", m: "TypeSafe Jev", s: "dedicated decision model" },
            { n: "New member", m: "OpenAI Decisions API", s: "an LLM in a classifier costume · preview" },
          ].map((r, i) => (
            <div key={r.m} style={{ borderTop: "1px solid #26322d", paddingTop: 20, opacity: tween(f, [62 + i * 16, 74 + i * 16], [0, 1]) }}>
              <div style={{ fontFamily: mono, fontSize: 22, color: "#8b938e" }}>{r.n.toUpperCase()}</div>
              <div style={{ fontSize: 50, fontWeight: 700, letterSpacing: -1.5 }}>{r.m}</div>
              <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 34, color: "#aee2c6" }}>{r.s}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            right: 40,
            top: 36,
            border: `6px solid ${C.lemon}`,
            color: C.lemon,
            borderRadius: 16,
            padding: "6px 22px",
            fontSize: 54,
            fontWeight: 800,
            letterSpacing: 2,
            rotate: "-12deg",
            scale: 2 - stamp,
            opacity: stamp,
          }}
        >
          WELCOME
        </div>
      </div>
      {/* confetti */}
      {confetti.map((_, i) => {
        const t = f - 108;
        if (t < 0) return null;
        const ang = (i / confetti.length) * Math.PI * 2;
        const v = 14 + (i % 5) * 4;
        const x = 540 + Math.cos(ang) * v * t;
        const y = 600 + Math.sin(ang) * v * t + 0.9 * t * t;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 18,
              height: 10,
              borderRadius: 3,
              background: i % 3 === 0 ? C.lemon : i % 3 === 1 ? C.pine : "#aee2c6",
              rotate: `${t * (8 + (i % 7))}deg`,
              opacity: tween(f, [108, 150], [1, 0]),
            }}
          />
        );
      })}
    </Shell>
  );
};
