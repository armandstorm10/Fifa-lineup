import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Player, Template } from "@lineupai/shared";

const TEMPLATE_COLORS: Record<Template, { accent: string; bg: string; text: string }> = {
  "world-cup-gold": { accent: "#FFD700", bg: "#0A1628", text: "#FFFFFF" },
  "champions-league-navy": { accent: "#4A90D9", bg: "#0A1628", text: "#FFFFFF" },
  "stadium-night": { accent: "#00B140", bg: "#050A0E", text: "#FFFFFF" },
};

export const NameCard: React.FC<{ player: Player; template: Template }> = ({
  player,
  template,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { accent, bg } = TEMPLATE_COLORS[template];
  const totalFrames = Math.round(fps * 1.5);

  const slideY = interpolate(frame, [0, totalFrames * 0.3], [80, 0], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, totalFrames * 0.25], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: bg, alignItems: "center", justifyContent: "flex-end" }}>
      <div style={{
        width: "100%",
        padding: "0 60px 160px 60px",
        transform: `translateY(${slideY}px)`,
        opacity,
      }}>
        {/* Shirt number */}
        <div style={{ fontSize: 120, fontWeight: 900, color: accent, lineHeight: 1, marginBottom: 8 }}>
          {player.shirtNumber}
        </div>
        {/* Name */}
        <div style={{ fontSize: 72, fontWeight: 800, color: "#FFF", lineHeight: 1.1, marginBottom: 16 }}>
          {player.name.toUpperCase()}
        </div>
        {/* Position bar */}
        <div style={{
          display: "inline-block",
          background: accent,
          color: "#000",
          padding: "8px 24px",
          borderRadius: 6,
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: "0.1em",
        }}>
          {player.position}
        </div>
      </div>
    </AbsoluteFill>
  );
};
