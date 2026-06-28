import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Player, Template } from "@lineupai/shared";
import { AVAILABLE_FLAGS } from "../flags";

// accent = highlight color; backdrop = gradient used ONLY as a fallback when the
// player's country has no bundled flag asset.
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

// Animated national flag backdrop. Gentle, looping-friendly sway + slow scale
// driven by sine over the whole composition so it tiles seamlessly on loop.
const FlagBackdrop: React.FC<{ country: string }> = ({ country }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const code = country.toLowerCase();

  // One full sine cycle over the clip's duration → seamless loop.
  const phase = (frame / Math.max(durationInFrames, 1)) * Math.PI * 2;

  // Subtle horizontal drift (±1.5%) and slow breathing scale (1.10 ± 0.03).
  // The base scale > 1 means the drift never exposes the frame edges.
  const driftX = Math.sin(phase) * 1.5;          // percent
  const scale = 1.1 + Math.sin(phase) * 0.03;

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0A0E1A" }}>
      <Img
        src={staticFile(`flags/${code}.svg`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translateX(${driftX}%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
      {/* Darkening scrim so the keyed player reads clearly over the flag. */}
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.28)" }} />
    </AbsoluteFill>
  );
};

export const PlayerClip: React.FC<{ player: Player; template: Template }> = ({
  player,
  template,
}) => {
  const { accent, backdrop } = TEMPLATE_COLORS[template];
  const src = player.processedClipPath || player.clipPath;
  const hasFlag = AVAILABLE_FLAGS.has(player.country.toLowerCase());

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
      {/* Backdrop: animated national flag, or gradient fallback if the country
          has no bundled flag asset (never renders blank). */}
      {hasFlag ? (
        <FlagBackdrop country={player.country} />
      ) : (
        <AbsoluteFill style={{ background: backdrop }} />
      )}

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
