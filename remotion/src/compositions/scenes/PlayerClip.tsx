import { AbsoluteFill, Video, OffthreadVideo, staticFile } from "remotion";
import { Player, Template } from "@lineupai/shared";

const TEMPLATE_COLORS: Record<Template, { accent: string }> = {
  "world-cup-gold": { accent: "#FFD700" },
  "champions-league-navy": { accent: "#4A90D9" },
  "stadium-night": { accent: "#00B140" },
};

export const PlayerClip: React.FC<{ player: Player; template: Template }> = ({
  player,
  template,
}) => {
  const { accent } = TEMPLATE_COLORS[template];
  const src = player.processedClipPath || player.clipPath;

  // When clipPath is empty (preview in Remotion Studio) show a placeholder
  if (!src) {
    return (
      <AbsoluteFill style={{ background: "#111827", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: accent, fontSize: 48, fontWeight: 800 }}>YOUR CLIP</div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo
        src={src.startsWith("http") ? src : `file://${src}`}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Accent vignette border */}
      <div style={{
        position: "absolute",
        inset: 0,
        boxShadow: `inset 0 0 80px ${accent}55`,
        pointerEvents: "none",
      }} />
    </AbsoluteFill>
  );
};
