import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, sans, tween } from "../theme";

/** Scene shell: background, safe area, soft fade at both ends. */
export const Shell: React.FC<{ dur: number; bg?: string; children: React.ReactNode; grid?: boolean }> = ({ dur, bg = C.paper, children, grid }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: bg, fontFamily: sans, color: C.ink }}>
      {grid && (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(to right, rgba(19,32,26,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(19,32,26,.06) 1px, transparent 1px)`,
            backgroundSize: "54px 54px",
            maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)",
          }}
        />
      )}
      <AbsoluteFill style={{ opacity: tween(f, [dur - 8, dur], [1, 0.0]) }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** A tiny resume: header bar + text lines. `hi` highlights one line in lemon. */
export const ResumeCard: React.FC<{ w: number; style?: React.CSSProperties; hi?: number; dim?: number; tint?: string }> = ({ w, style, hi, dim = 0, tint }) => {
  const h = w * 1.3;
  const lines = [0.8, 0.55, 0.7, 0.62, 0.75, 0.5];
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: w * 0.08,
        background: tint ?? C.surface,
        border: `1px solid ${C.line}`,
        boxShadow: "0 6px 18px -10px rgba(19,32,26,.35)",
        padding: w * 0.1,
        boxSizing: "border-box",
        filter: `grayscale(${dim}) opacity(${1 - dim * 0.45})`,
        ...style,
      }}
    >
      <div style={{ width: "45%", height: w * 0.07, borderRadius: 99, background: C.pine, opacity: 0.85, marginBottom: w * 0.08 }} />
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            width: `${l * 100}%`,
            height: w * 0.045,
            borderRadius: 99,
            background: hi === i ? C.lemon : "#d9d9cf",
            marginBottom: w * 0.055,
            boxShadow: hi === i ? `0 0 0 ${w * 0.02}px ${C.lemon}` : undefined,
          }}
        />
      ))}
    </div>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, bg = C.pineSoft, color = C.pine, size = 30, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.3,
      padding: `${size * 0.25}px ${size * 0.6}px`,
      borderRadius: 999,
      background: bg,
      color,
      fontSize: size,
      fontWeight: 600,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

export const Mark: React.FC<{ size: number; color?: string; cardY?: number; cardRot?: number; barsY?: number; style?: React.CSSProperties }> = ({ size, color = C.ink, cardY = 0, cardRot = -12.35, barsY = 0, style }) => (
  <svg viewBox="185 185 654 654" width={size} height={size} style={{ overflow: "visible", ...style }}>
    <g fill={color} transform={`translate(0 ${barsY})`}>
      <rect x="256" y="526" width="512" height="128" rx="26" />
      <rect x="256" y="690" width="512" height="128" rx="26" />
    </g>
    <rect x="263.3" y={245.2 + cardY} width="486.4" height="212" rx="34" fill={color} transform={`rotate(${cardRot} 506.5 ${351.2 + cardY})`} />
  </svg>
);
