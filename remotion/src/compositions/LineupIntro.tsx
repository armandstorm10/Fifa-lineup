import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { z } from "zod";
import { Player, Template, AspectRatio, Resolution } from "@lineupai/shared";
import { CountryOpener } from "./scenes/CountryOpener";
import { PlayerClip } from "./scenes/PlayerClip";
import { WatermarkOverlay } from "./scenes/WatermarkOverlay";

// Per-player timing (seconds). The clip ENDS on the player scene — no outro.
export const OPENER_SECONDS = 1;
export const CLIP_SECONDS = 3;
export const PLAYER_SECONDS = OPENER_SECONDS + CLIP_SECONDS;

// Template accent + fallback backdrop, shared with the opener.
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

// Zod schema for Remotion prop validation
export const lineupIntroSchema = z.object({
  players: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      country: z.string(),
      position: z.string(),
      shirtNumber: z.number(),
      clipPath: z.string(),
      processedClipPath: z.string().optional(),
    })
  ),
  template: z.enum(["world-cup-gold", "champions-league-navy", "stadium-night"]),
  aspectRatio: z.enum(["9:16", "16:9"]),
  watermark: z.boolean(),
  resolution: z.union([z.literal(480), z.literal(1080)]),
});

export type CompositionProps = {
  players: Player[];
  template: Template;
  aspectRatio: AspectRatio;
  watermark: boolean;
  resolution: Resolution;
};

export const LineupIntro: React.FC<CompositionProps> = ({
  players,
  template,
  watermark,
}) => {
  return (
    <AbsoluteFill style={{ background: "#0A0E1A" }}>
      {/* Map over players — v1 has 1, team mode will have N */}
      {players.map((player) => (
        <PlayerSequence key={player.id} player={player} template={template} />
      ))}
      {watermark && <WatermarkOverlay />}
    </AbsoluteFill>
  );
};

const PlayerSequence: React.FC<{
  player: Player;
  template: Template;
}> = ({ player, template }) => {
  const { fps } = useVideoConfig();
  const { accent, backdrop } = TEMPLATE_COLORS[template];
  return (
    <AbsoluteFill>
      <Series>
        {/* ~1s flag-sweep + country-name opener, wiping into the clip */}
        <Series.Sequence durationInFrames={Math.round(fps * OPENER_SECONDS)}>
          <CountryOpener country={player.country} accent={accent} backdrop={backdrop} />
        </Series.Sequence>

        {/* Player clip — the video ENDS here, no outro */}
        <Series.Sequence durationInFrames={Math.round(fps * CLIP_SECONDS)}>
          <PlayerClip player={player} template={template} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
