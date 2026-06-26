import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Template } from "@lineupai/shared";

const TEMPLATE_COLORS: Record<Template, { accent: string; bg: string }> = {
  "world-cup-gold": { accent: "#FFD700", bg: "#0A1628" },
  "champions-league-navy": { accent: "#4A90D9", bg: "#0A1628" },
  "stadium-night": { accent: "#00B140", bg: "#050A0E" },
};

// Flag emoji map for common countries
const FLAG_MAP: Record<string, string> = {
  ZA: "🇿🇦", NG: "🇳🇬", EG: "🇪🇬", MA: "🇲🇦", SN: "🇸🇳",
  GH: "🇬🇭", CM: "🇨🇲", BR: "🇧🇷", AR: "🇦🇷", FR: "🇫🇷",
  DE: "🇩🇪", ES: "🇪🇸", PT: "🇵🇹", GB: "🇬🇧", US: "🇺🇸", MX: "🇲🇽",
};

export const FlagReveal: React.FC<{ country: string; template: Template }> = ({
  country,
  template,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { accent, bg } = TEMPLATE_COLORS[template];
  const totalFrames = Math.round(fps * 1.5);

  const scale = interpolate(frame, [0, totalFrames * 0.4], [0.2, 1], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, totalFrames * 0.2], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: bg, alignItems: "center", justifyContent: "center" }}>
      {/* Accent ring */}
      <div style={{
        position: "absolute",
        width: 400,
        height: 400,
        borderRadius: "50%",
        border: `6px solid ${accent}`,
        opacity: opacity * 0.4,
        transform: `scale(${scale * 1.3})`,
      }} />
      {/* Flag */}
      <div style={{ fontSize: 180, transform: `scale(${scale})`, opacity }}>
        {FLAG_MAP[country] ?? "🏳️"}
      </div>
      {/* Country code */}
      <div style={{
        position: "absolute",
        bottom: "30%",
        color: accent,
        fontSize: 48,
        fontWeight: 800,
        letterSpacing: "0.3em",
        opacity,
      }}>
        {country}
      </div>
    </AbsoluteFill>
  );
};
