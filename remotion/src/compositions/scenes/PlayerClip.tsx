import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  interpolate,
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

// FIFA-style hero name + big shirt number overlay. Sits ABOVE the flag and the
// player clip. Animates in slightly after the clip starts (fade + slide-up +
// scale) for a broadcast "reveal" feel. Missing fields are omitted cleanly.
const NameNumberOverlay: React.FC<{ player: Player; accent: string }> = ({
  player,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const name = player.name?.trim();
  const position = player.position?.trim();
  const hasNumber = Number.isFinite(player.shirtNumber);
  if (!name && !position && !hasNumber) return null;

  // Reveal starts ~0.4s in, eases over ~0.7s.
  const start = Math.round(fps * 0.4);
  const dur = Math.round(fps * 0.7);
  const t = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const slideUp = interpolate(t, [0, 1], [60, 0]);
  const numberScale = interpolate(t, [0, 1], [1.15, 1]);

  const textShadow = "0 2px 12px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)";

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", pointerEvents: "none" }}>
      {/* Bottom scrim so text stays legible over any flag */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 28%, rgba(0,0,0,0) 50%)",
        }}
      />

      <div
        style={{
          position: "relative",
          padding: "0 64px 150px",
          opacity: t,
          transform: `translateY(${slideUp}px)`,
        }}
      >
        {/* Hero shirt number — oversized, accent, sits low so it clears the face */}
        {hasNumber && (
          <div
            style={{
              fontSize: 360,
              fontWeight: 900,
              lineHeight: 0.8,
              color: accent,
              opacity: 0.92,
              letterSpacing: "-0.04em",
              transform: `scale(${numberScale})`,
              transformOrigin: "left bottom",
              textShadow,
              marginBottom: 8,
            }}
          >
            {player.shirtNumber}
          </div>
        )}

        {/* Name — strong condensed bold */}
        {name && (
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1,
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              textShadow,
            }}
          >
            {name}
          </div>
        )}

        {/* Position — smaller label under the name, with an accent tab */}
        {position && (
          <div
            style={{
              marginTop: 18,
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ width: 40, height: 6, background: accent, borderRadius: 3 }} />
            <span
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                textShadow,
              }}
            >
              {position}
            </span>
          </div>
        )}
      </div>
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

      {/* FIFA-style name + hero number — ABOVE flag and player clip. */}
      <NameNumberOverlay player={player} accent={accent} />
    </AbsoluteFill>
  );
};
