import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import { Player, Template } from "@lineupai/shared";

// accent = highlight color; backdrop = stadium-ish gradient behind the keyed
// player. Swap `backdrop` for a real stadium image/video per template later.
const TEMPLATE_COLORS: Record<Template, { accent: string; backdrop: string }> = {
  "world-cup-gold": {
    accent: "#FFD700",
    backdrop: "radial-gradient(ellipse at 50% 30%, #1a2a4a 0%, #0A1628 70%)",
  },
  "champions-league-navy": {
    accent: "#4A90D9",
    backdrop: "radial-gradient(ellipse at 50% 30%, #13294f 0%, #060d1f 70%)",
  },
  "stadium-night": {
    accent: "#00B140",
    backdrop: "radial-gradient(ellipse at 50% 30%, #0c2418 0%, #050A0E 70%)",
  },
};

export const PlayerClip: React.FC<{ player: Player; template: Template }> = ({
  player,
  template,
}) => {
  const { accent, backdrop } = TEMPLATE_COLORS[template];
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
    <AbsoluteFill>
      {/* Template backdrop, behind the keyed player */}
      <AbsoluteFill style={{ background: backdrop }} />

      {/* Transparent VP9 player clip overlaid on the backdrop. transparent lets
          OffthreadVideo decode the WebM's alpha channel. src is an http URL the
          backend serves. (Opaque-fallback clips simply fill the frame.)
          MUST be wrapped in <AbsoluteFill>: OffthreadVideo renders an in-flow
          <img>, which the absolutely-positioned backdrop/vignette would paint
          OVER, hiding the player. AbsoluteFill puts it in the same stacking
          layer so DOM order (after the backdrop) wins. */}
      <AbsoluteFill>
        <OffthreadVideo
          src={src}
          transparent
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

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
