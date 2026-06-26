import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { z } from "zod";
import { Player, Template, AspectRatio, Resolution } from "@lineupai/shared";
import { FlagReveal } from "./scenes/FlagReveal";
import { NameCard } from "./scenes/NameCard";
import { PlayerClip } from "./scenes/PlayerClip";
import { WatermarkOverlay } from "./scenes/WatermarkOverlay";

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

// Frames per player sequence
const FRAMES_PER_PLAYER = 150; // 5s at 30fps

export const LineupIntro: React.FC<CompositionProps> = ({
  players,
  template,
  watermark,
}) => {
  return (
    <AbsoluteFill style={{ background: "#0A0E1A" }}>
      {/* Map over players — v1 has 1, team mode will have N */}
      {players.map((player, i) => (
        <PlayerSequence
          key={player.id}
          player={player}
          template={template}
          startFrame={i * FRAMES_PER_PLAYER}
        />
      ))}
      {watermark && <WatermarkOverlay />}
    </AbsoluteFill>
  );
};

const PlayerSequence: React.FC<{
  player: Player;
  template: Template;
  startFrame: number;
}> = ({ player, template }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Series>
        {/* Flag reveal: 1.5s */}
        <Series.Sequence durationInFrames={Math.round(fps * 1.5)}>
          <FlagReveal country={player.country} template={template} />
        </Series.Sequence>

        {/* Player clip: 2s */}
        <Series.Sequence durationInFrames={Math.round(fps * 2)}>
          <PlayerClip player={player} template={template} />
        </Series.Sequence>

        {/* Name card: 1.5s */}
        <Series.Sequence durationInFrames={Math.round(fps * 1.5)}>
          <NameCard player={player} template={template} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
