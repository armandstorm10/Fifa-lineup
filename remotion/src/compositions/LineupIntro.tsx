import {
  AbsoluteFill,
  Audio,
  Series,
  interpolate,
  staticFile,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { Player, Template, AspectRatio, Resolution } from "@lineupai/shared";
import { CountryOpener } from "./scenes/CountryOpener";
import { PlayerClip } from "./scenes/PlayerClip";
import { WatermarkOverlay } from "./scenes/WatermarkOverlay";

// Crowd-cheer bed. Must live under remotion/public so renders are self-contained.
export const CROWD_AUDIO_FILE = "audio/397434_foolboymedia__crowd-cheer.wav";

// Per-player timing (seconds). The clip ENDS on the player scene — no outro.
export const OPENER_SECONDS = 1;
// Fallback clip length only when a clip's duration can't be probed.
export const DEFAULT_CLIP_SECONDS = 3;
// Hard cap: clips longer than this are truncated (the player Sequence ends here,
// cutting OffthreadVideo off). No minimum is imposed — short clips play in full.
export const MAX_CLIP_SECONDS = 8;
export const FPS = 30;

// Clip length for one player: the probed duration (capped at MAX_CLIP_SECONDS),
// else the fallback.
function clipSeconds(player: Player): number {
  const d = player.durationInSeconds;
  const seconds = d && Number.isFinite(d) && d > 0 ? d : DEFAULT_CLIP_SECONDS;
  return Math.min(seconds, MAX_CLIP_SECONDS);
}

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
      durationInSeconds: z.number().optional(),
    })
  ),
  template: z.enum(["world-cup-gold", "champions-league-navy", "stadium-night"]),
  aspectRatio: z.enum(["9:16", "16:9"]),
  watermark: z.boolean(),
  resolution: z.union([z.literal(480), z.literal(1080)]),
  // Set by the backend only when the crowd-cheer asset is present, so a missing
  // file never hard-fails the render.
  crowdAudio: z.boolean().optional(),
});

export type CompositionProps = {
  players: Player[];
  template: Template;
  aspectRatio: AspectRatio;
  watermark: boolean;
  resolution: Resolution;
  crowdAudio?: boolean;
};

// Drives the total render length from the clips themselves — no fixed cap.
// Each player = opener + its clip; for v1 (one player) total = opener + clip.
// (Players currently overlap from frame 0, so the longest player wins.)
export const calculateLineupMetadata = ({ props }: { props: CompositionProps }) => {
  const perPlayer = props.players.map(
    (p) => Math.round(FPS * OPENER_SECONDS) + Math.round(FPS * clipSeconds(p))
  );
  const durationInFrames = Math.max(1, ...perPlayer);
  return { durationInFrames, fps: FPS };
};

// Crowd-cheer bed: plays from frame 0, full volume, fading out over the last ~1s.
const CrowdAudio: React.FC = () => {
  const { durationInFrames, fps } = useVideoConfig();
  const fade = Math.min(Math.round(fps * 1), durationInFrames);
  return (
    <Audio
      src={staticFile(CROWD_AUDIO_FILE)}
      volume={(f) =>
        interpolate(f, [durationInFrames - fade, durationInFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
  );
};

export const LineupIntro: React.FC<CompositionProps> = ({
  players,
  template,
  watermark,
  crowdAudio,
}) => {
  return (
    <AbsoluteFill style={{ background: "#0A0E1A" }}>
      {/* Map over players — v1 has 1, team mode will have N */}
      {players.map((player) => (
        <PlayerSequence key={player.id} player={player} template={template} />
      ))}
      {crowdAudio && <CrowdAudio />}
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

        {/* Player clip — length driven by the clip itself; video ENDS here */}
        <Series.Sequence durationInFrames={Math.round(fps * clipSeconds(player))}>
          <PlayerClip player={player} template={template} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
