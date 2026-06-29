export type Position =
  | "GK" | "CB" | "LB" | "RB" | "CDM" | "CM"
  | "CAM" | "LW" | "RW" | "ST" | "CF";

export interface Player {
  id: string;
  name: string;
  country: string;        // ISO 3166-1 alpha-2, e.g. "ZA"
  position: Position;
  shirtNumber: number;    // 1–99
  clipPath: string;       // storage key (local path or S3 key)
  processedClipPath?: string; // set after background removal
  durationInSeconds?: number; // probed clip length; drives render duration
}
