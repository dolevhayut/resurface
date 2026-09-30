import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { Easing, interpolate } from "remotion";

export const sans = loadGeist("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;
export const mono = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;
export const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily;

export const C = {
  paper: "#f6f5ee",
  surface: "#fffffc",
  ink: "#13201a",
  muted: "#56615b",
  faint: "#8b938e",
  line: "#e1e0d6",
  pine: "#1d5b44",
  pineSoft: "#e3efe8",
  lemon: "#e8d640",
  lemonSoft: "#faf5cf",
  night: "#0c110f",
  nightLine: "#1f2a25",
  bad: "#b3372f",
  gold: "#c9a227",
};

export const W = 1080;
export const H = 1350;
export const FPS = 30;

const out = Easing.bezier(0.16, 1, 0.3, 1);

/** Clamped interpolate with an ease-out curve — the house motion. */
export const tween = (frame: number, range: [number, number], to: [number, number], easing = out) =>
  interpolate(frame, range, to, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Spring-like overshoot for "slam" entrances. */
export const pop = (frame: number, start: number, dur = 14) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
