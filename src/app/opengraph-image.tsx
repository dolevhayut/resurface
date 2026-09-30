import { ImageResponse } from "next/og";

export const alt = "Resurface — Language models write. Classification models decide.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social preview (LinkedIn / X / Slack): headline + the measured numbers.
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f6f5ee", color: "#13201a", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="120 120 784 784">
            <rect x="120" y="120" width="784" height="784" rx="176" fill="#1d5b44" />
            <g fill="#fffffc" transform="translate(512 512) scale(0.78) translate(-512 -512)">
              <rect x="256" y="526" width="512" height="128" rx="26" />
              <rect x="256" y="690" width="512" height="128" rx="26" />
              <rect x="263.3" y="245.2" width="486.4" height="212" rx="34" transform="rotate(-12.35 506.5 351.2)" />
            </g>
          </svg>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>Resurface</div>
          <div style={{ marginLeft: "auto", fontSize: 20, color: "#8b938e", letterSpacing: 3 }}>DATASHEET Nº 01</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
          <div>Language models write.</div>
          <div style={{ display: "flex" }}>
            Classification models <span style={{ background: "#e8d640", padding: "0 12px", marginLeft: 18 }}>decide.</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 48, fontSize: 30, color: "#56615b" }}>
          <div style={{ display: "flex" }}>
            <b style={{ color: "#1d5b44", marginRight: 10 }}>8×</b> faster
          </div>
          <div style={{ display: "flex" }}>
            <b style={{ color: "#1d5b44", marginRight: 10 }}>31×</b> cheaper
          </div>
          <div style={{ display: "flex" }}>
            <b style={{ color: "#1d5b44", marginRight: 10 }}>99%</b> same verdicts as Claude Sonnet 5.5
          </div>
        </div>
      </div>
    ),
    size,
  );
}
