import { AbsoluteFill } from "remotion";

export const WatermarkOverlay: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {/* Bottom-right watermark */}
    <div style={{
      position: "absolute",
      bottom: 40,
      right: 40,
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(6px)",
      borderRadius: 8,
      padding: "8px 16px",
      color: "#FFD700",
      fontWeight: 800,
      fontSize: 28,
      letterSpacing: "0.05em",
      opacity: 0.85,
    }}>
      LineupAI
    </div>
    {/* Diagonal faint watermark */}
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%) rotate(-30deg)",
      color: "rgba(255,215,0,0.06)",
      fontSize: 120,
      fontWeight: 900,
      whiteSpace: "nowrap",
      userSelect: "none",
    }}>
      LINEUPAI
    </div>
  </AbsoluteFill>
);
