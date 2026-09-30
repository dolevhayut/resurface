import React from "react";
import { useCurrentFrame } from "remotion";
import { C, mono, pop, serif, tween } from "../theme";
import { Mark, Shell } from "./parts";
import { sceneFrames } from "./data";

export const CTA: React.FC = () => {
  const f = useCurrentFrame();
  const dur = sceneFrames(7);
  const drop = pop(f, 10, 18);
  return (
    <Shell dur={dur + 20} bg={C.pine}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", flexDirection: "column", alignItems: "center", color: C.surface }}>
        <Mark size={260} color={C.surface} barsY={tween(f, [0, 14], [260, 0])} cardY={(1 - drop) * -520} cardRot={-12.35 + (1 - drop) * 30} />
        <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -8, marginTop: 36, opacity: tween(f, [22, 36], [0, 1]), translate: `0 ${tween(f, [22, 40], [40, 0])}px` }}>Resurface</div>
        <div style={{ fontFamily: mono, fontSize: 30, letterSpacing: 3, color: "#aee2c6", marginTop: 10, opacity: tween(f, [38, 52], [0, 1]) }}>OPEN SOURCE · BUILT ON TYPESAFE JEV</div>
        <div style={{ fontSize: 72, fontWeight: 600, letterSpacing: -3, marginTop: 80, textAlign: "center", lineHeight: 1.08, opacity: tween(f, [104, 120], [0, 1]) }}>
          Keep your ATS.
          <br />
          <span style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 400, color: C.lemon, fontSize: 90 }}>Rediscover</span> your talent.
        </div>
        <div
          style={{
            marginTop: 70,
            background: C.lemon,
            color: C.ink,
            borderRadius: 999,
            padding: "22px 40px",
            fontFamily: mono,
            fontSize: 34,
            fontWeight: 500,
            opacity: tween(f, [150, 162], [0, 1]),
            scale: 0.8 + 0.2 * pop(f, 150, 14),
          }}
        >
          github.com/dolevhayut/resurface
        </div>
      </div>
    </Shell>
  );
};
