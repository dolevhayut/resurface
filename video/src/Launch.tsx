import React from "react";
import { AbsoluteFill, Sequence, Series, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C, sans, tween } from "./theme";
import { FPS, SCENES, TOTAL, sceneFrames } from "./scenes/data";
import { Hook } from "./scenes/Hook";
import { Write } from "./scenes/Write";
import { Decide } from "./scenes/Decide";
import { How } from "./scenes/How";
import { Race } from "./scenes/Race";
import { Agree } from "./scenes/Agree";
import { OpenAI } from "./scenes/OpenAI";
import { CTA } from "./scenes/CTA";

const VO_DELAY = 4;
const DARK = new Set(["Write", "CTA"]);
// Scenes whose headline already says the line on screen: no duplicate caption.
const NO_CAPTION = new Set(["Decide", "Agree", "CTA"]);

/** Burned-in captions: phrases timed by character share of each voiceover clip (LinkedIn autoplays muted). */
const Captions: React.FC<{ phrases: readonly string[]; voSec: number; dark: boolean }> = ({ phrases, voSec, dark }) => {
  const f = useCurrentFrame() - VO_DELAY;
  const total = phrases.reduce((s, p) => s + p.length, 0);
  let acc = 0;
  const spans = phrases.map((p) => {
    const start = (acc / total) * voSec * FPS;
    acc += p.length;
    return { p, start, end: (acc / total) * voSec * FPS };
  });
  const cur = spans.find((s, i) => f >= s.start && (f < s.end || i === spans.length - 1)) ?? spans[0];
  const local = f - cur.start;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 84 }}>
      <div
        key={cur.p}
        style={{
          maxWidth: 900,
          textAlign: "center",
          fontFamily: sans,
          fontSize: 42,
          fontWeight: 600,
          lineHeight: 1.25,
          letterSpacing: -0.5,
          padding: "16px 30px",
          borderRadius: 22,
          background: dark ? "rgba(255,255,252,.94)" : "rgba(19,32,26,.9)",
          color: dark ? C.ink : "#fffffc",
          opacity: f < 0 ? 0 : tween(local, [0, 5], [0, 1]),
          translate: `0 ${tween(local, [0, 8], [14, 0])}px`,
        }}
      >
        {cur.p}
      </div>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: C.lemon, zIndex: 50 }} />;
};

const SCENE_COMPONENTS = [Hook, Write, Decide, How, Race, Agree, OpenAI, CTA];

export const Launch: React.FC<{ music: boolean }> = ({ music }) => {
  let at = 0;
  const starts = SCENES.map((_, i) => {
    const s = at;
    at += sceneFrames(i);
    return s;
  });
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <Series>
        {SCENES.map((s, i) => {
          const Comp = SCENE_COMPONENTS[i];
          return (
            <Series.Sequence key={s.id} name={s.id} durationInFrames={sceneFrames(i)}>
              <Comp />
              {!NO_CAPTION.has(s.id) && <Captions phrases={s.caption} voSec={s.voSec} dark={DARK.has(s.id)} />}
              <Sequence from={VO_DELAY} layout="none">
                <Audio src={staticFile(s.vo)} volume={1} />
              </Sequence>
            </Series.Sequence>
          );
        })}
      </Series>
      {/* whoosh on every cut */}
      {starts.slice(1).map((s, i) => (
        <Sequence key={i} from={s - 6} durationInFrames={30} layout="none">
          <Audio src="https://remotion.media/whoosh.wav" volume={0.18} />
        </Sequence>
      ))}
      {/* ding on the big numbers */}
      {[starts[4] + 80, starts[4] + 128, starts[5] + 70].map((s, i) => (
        <Sequence key={`d${i}`} from={s} durationInFrames={40} layout="none">
          <Audio src="https://remotion.media/ding.wav" volume={0.12} />
        </Sequence>
      ))}
      {music && (
        <Audio
          src={staticFile("music.mp3")}
          volume={(f) => interpolate(f, [0, 30, TOTAL - 60, TOTAL], [0, 0.16, 0.16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      )}
      <Progress />
    </AbsoluteFill>
  );
};
