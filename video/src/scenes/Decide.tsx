import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, pop, serif, tween } from "../theme";
import { Shell } from "./parts";
import { sceneFrames } from "./data";

export const Decide: React.FC = () => {
  const f = useCurrentFrame();
  const dur = sceneFrames(2);
  const strike = tween(f, [44, 60], [0, 1]);
  const slam = pop(f, 66, 14);
  const wipe = tween(f, [62, 80], [0, 1]);
  return (
    <Shell dur={dur}>
      {/* lemon wipe behind the decision */}
      <AbsoluteFill style={{ background: C.lemon, clipPath: `circle(${wipe * 120}% at 50% 62%)` }} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 250 }}>
        <div style={{ fontSize: 78, fontWeight: 600, letterSpacing: -3, lineHeight: 1.08, opacity: tween(f, [0, 12], [0, 1]) }}>
          Screening a resume
          <br />
          isn&apos;t an{" "}
          <span style={{ position: "relative", color: wipe > 0.5 ? C.ink : C.muted }}>
            essay.
            <span style={{ position: "absolute", left: -6, right: -6, top: "55%", height: 10, borderRadius: 6, background: C.bad, scale: `${strike} 1`, transformOrigin: "left" }} />
          </span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 640,
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: -4,
          opacity: tween(f, [62, 70], [0, 1]),
        }}
      >
        It&apos;s a
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 720,
          fontFamily: serif,
          fontStyle: "italic",
          fontSize: 250,
          lineHeight: 1,
          letterSpacing: -6,
          opacity: tween(f, [66, 72], [0, 1]),
          scale: 0.7 + 0.3 * slam,
          transformOrigin: "left center",
        }}
      >
        decision.
      </div>
    </Shell>
  );
};
