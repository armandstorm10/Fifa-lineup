import { Player } from "./player";

export type Template =
  | "world-cup-gold"
  | "champions-league-navy"
  | "stadium-night";

export type AspectRatio = "9:16" | "16:9"; // 16:9 unused in v1

export type Resolution = 480 | 1080;

export type Tier = "free" | "individual";

export type JobStatus =
  | "queued"
  | "processing-clip"
  | "removing-background"
  | "compositing"
  | "rendering"
  | "complete"
  | "failed";

export interface RenderJob {
  id: string;
  createdAt: string;      // ISO timestamp

  status: JobStatus;
  error?: string;

  // render inputs
  players: Player[];      // array even for v1's single player
  template: Template;
  aspectRatio: AspectRatio; // default "9:16"
  tier: Tier;
  watermark: boolean;     // derived from tier at job-creation time
  resolution: Resolution; // derived from tier at job-creation time

  // outputs
  outputPath?: string;    // storage key of final MP4
  outputUrl?: string;     // served URL for download
}
