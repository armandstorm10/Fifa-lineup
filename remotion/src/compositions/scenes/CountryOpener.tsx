import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Template } from "@lineupai/shared";
import { AVAILABLE_FLAGS } from "../flags";
import { countryDisplayName } from "../countryNames";

// ~1s broadcast opener: the national flag sweeps across frame while the country
// name slides in, then the whole thing scales up + fades as a clean wipe into
// the PlayerClip scene. Falls back to an accent-colored open when no flag exists.
export const CountryOpener: React.FC<{
  country: string;
  accent: string;
  backdrop: string;
}> = ({ country, accent, backdrop }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const code = country.toLowerCase();
  const hasFlag = AVAILABLE_FLAGS.has(code);
  const name = countryDisplayName(country);

  // Flag sweeps in from the left, eases to rest.
  const flagX = interpolate(frame, [0, Math.round(fps * 0.4)], [-110, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Country name slides up + fades in slightly after the flag.
  const nameStart = Math.round(fps * 0.2);
  const nameT = interpolate(frame, [nameStart, nameStart + Math.round(fps * 0.35)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const nameY = interpolate(nameT, [0, 1], [70, 0]);

  // Exit wipe: last ~0.2s scale up + fade so it flows into the player clip.
  const exitStart = durationInFrames - Math.round(fps * 0.2);
  const exitT = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const exitScale = interpolate(exitT, [0, 1], [1, 1.12]);
  const exitOpacity = interpolate(exitT, [0, 1], [1, 0]);

  const textShadow = "0 2px 14px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)";

  return (
    <AbsoluteFill
      style={{
        background: backdrop,
        overflow: "hidden",
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}
    >
      {/* Flag sweep (or accent wash fallback) */}
      {hasFlag ? (
        <AbsoluteFill style={{ overflow: "hidden", transform: `translateX(${flagX}%)` }}>
          <Img
            src={staticFile(`flags/${code}.svg`)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            transform: `translateX(${flagX}%)`,
            background: `linear-gradient(120deg, ${accent} 0%, rgba(0,0,0,0.2) 100%)`,
          }}
        />
      )}

      {/* Darkening scrim for legibility */}
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)" }} />

      {/* Country name — bold broadcast style, accent underline */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            opacity: nameT,
            transform: `translateY(${nameY}px)`,
            textAlign: "center",
            padding: "0 48px",
          }}
        >
          <div
            style={{
              fontSize: 130,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 0.95,
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              textShadow,
            }}
          >
            {name}
          </div>
          <div
            style={{
              margin: "28px auto 0",
              width: 180,
              height: 10,
              borderRadius: 5,
              background: accent,
              boxShadow: textShadow,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
