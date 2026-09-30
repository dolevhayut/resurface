import React from "react";
import { useCurrentFrame } from "remotion";
import { C, mono, pop, serif, tween } from "../theme";
import { Chip, ResumeCard, Shell } from "./parts";
import { sceneFrames } from "./data";

const QUESTIONS = ["Hands-on React?", "Node.js services?", "5+ years?", "Schema design?", "Cloud in production?", "B2B SaaS?"];
const VERDICT = ["✓", "✓", "?", "✓", "✓", "✗", "✓", "?", "✓", "✓", "✓", "?", "✓", "✗", "✓", "✓", "?", "✓"];

export const How: React.FC = () => {
  const f = useCurrentFrame();
  const dur = sceneFrames(3);
  const zoom = tween(f, [252, 290], [0, 1]);
  return (
    <Shell dur={dur} grid>
      {/* lane 1: LLM, once */}
      <div style={{ position: "absolute", left: 90, top: 90, right: 90, opacity: 1 - zoom }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: tween(f, [0, 12], [0, 1]) }}>
          <Chip bg={C.lemonSoft} color="#6a5a00" size={28}>
            LLM · once per job
          </Chip>
          <span style={{ fontFamily: mono, fontSize: 24, color: C.faint }}>writes the questions</span>
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 28, alignItems: "flex-start" }}>
          <div
            style={{
              width: 260,
              height: 330,
              borderRadius: 22,
              background: C.surface,
              border: `1px solid ${C.line}`,
              padding: 24,
              boxSizing: "border-box",
              opacity: tween(f, [6, 20], [0, 1]),
              translate: `${tween(f, [6, 24], [-40, 0])}px 0`,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700 }}>Senior Full Stack</div>
            <div style={{ fontFamily: mono, fontSize: 18, color: C.faint, marginTop: 4 }}>JOB DESCRIPTION</div>
            {[0.9, 0.7, 0.85, 0.6, 0.8, 0.55, 0.75].map((w, i) => (
              <div key={i} style={{ height: 11, width: `${w * 100}%`, borderRadius: 9, background: i % 2 ? "#d9d9cf" : C.lemon, opacity: i % 2 ? 1 : tween(f, [30 + i * 6, 40 + i * 6], [0.25, 1]), marginTop: 16 }} />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            {QUESTIONS.map((q, i) => (
              <div
                key={q}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 18px",
                  borderRadius: 16,
                  background: C.surface,
                  border: `1px solid ${C.line}`,
                  fontSize: 30,
                  fontWeight: 600,
                  opacity: tween(f, [34 + i * 9, 44 + i * 9], [0, 1]),
                  translate: `${tween(f, [34 + i * 9, 50 + i * 9], [60, 0])}px 0`,
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 20, color: C.pine, background: C.pineSoft, borderRadius: 8, padding: "2px 8px" }}>Q{i + 1}</span>
                {q}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* lane 2: classifier, every resume */}
      <div style={{ position: "absolute", left: 90, right: 90, top: 560, opacity: 1 - zoom }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: tween(f, [118, 130], [0, 1]) }}>
          <Chip size={28}>Classifier · every resume</Chip>
          <span style={{ fontFamily: mono, fontSize: 24, color: C.faint }}>answers them, with evidence</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 18, marginTop: 26 }}>
          {VERDICT.map((v, i) => {
            const at = 130 + i * 6;
            const tone = v === "✓" ? C.pine : v === "✗" ? C.bad : C.gold;
            return (
              <div key={i} style={{ position: "relative", opacity: tween(f, [120 + i * 2, 132 + i * 2], [0, 1]) }}>
                <ResumeCard w={118} hi={v === "✓" && f > at ? 2 : undefined} />
                <div
                  style={{
                    position: "absolute",
                    right: -8,
                    top: -10,
                    width: 50,
                    height: 50,
                    borderRadius: 99,
                    background: tone,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 28,
                    fontWeight: 700,
                    scale: pop(f, at, 10),
                  }}
                >
                  {v}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* zoom: the exact line */}
      <div style={{ position: "absolute", left: 90, right: 90, top: 190, opacity: zoom, scale: 0.9 + 0.1 * zoom }}>
        <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: 3, color: C.muted }}>THE EVIDENCE IS SELECTED — NEVER WRITTEN</div>
        <div style={{ marginTop: 26, borderRadius: 30, background: C.surface, border: `1px solid ${C.line}`, padding: 40, boxShadow: "0 40px 90px -50px rgba(19,32,26,.5)" }}>
          {[
            ["L004", "Full Stack Developer — Halcyon Insurance | 2021 – Present"],
            ["L005", "- Developed REST APIs in Node.js serving 2M requests/day"],
            ["L006", "- Built dashboards in React and TypeScript for 40k users"],
            ["L007", "- Migrated a monolith to microservices on AWS"],
          ].map(([id, t]) => {
            const on = id === "L006";
            return (
              <div key={id} style={{ display: "flex", gap: 22, alignItems: "baseline", padding: "12px 14px", borderRadius: 12, position: "relative", fontSize: 32 }}>
                {on && <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: C.lemon, scale: `${tween(f, [282, 300], [0, 1])} 1`, transformOrigin: "left" }} />}
                <span style={{ position: "relative", fontFamily: mono, fontSize: 22, color: C.faint, width: 80 }}>{id}</span>
                <span style={{ position: "relative", fontWeight: on ? 600 : 400 }}>{t}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 34, alignItems: "center", opacity: tween(f, [300, 316], [0, 1]) }}>
          <Chip size={34}>SUPPORTED · 0.97</Chip>
          <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 50 }}>proof: line L006</span>
        </div>
      </div>
    </Shell>
  );
};
