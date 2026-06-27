import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import ffmpegStatic from "ffmpeg-static";

// ── Interface ─────────────────────────────────────────────────────────────────
// To swap providers: implement this interface and change the export below.
// Input: path to original video clip
// Output: path to processed clip (must be a web-playable .mp4)
export interface BackgroundRemovalService {
  removeBackground(inputPath: string, outputPath: string): Promise<void>;
}

// Transcode any input video into a web-friendly MP4 that browsers and Remotion's
// OffthreadVideo can fetch and decode: H.264 video (yuv420p), AAC audio, and
// +faststart so playback can begin before the whole file downloads. This is what
// makes iPhone .MOV / HEVC uploads work instead of hanging the render.
function transcodeToWebMp4(inputPath: string, outputPath: string): void {
  if (!ffmpegStatic) {
    throw new Error("ffmpeg-static binary not found — run `npm install`");
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  execFileSync(
    ffmpegStatic,
    [
      "-y",
      "-i", inputPath,
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-preset", "veryfast",
      "-movflags", "+faststart",
      "-c:a", "aac",
      outputPath,
    ],
    { stdio: "inherit" }
  );
}

// ── Mock implementation ───────────────────────────────────────────────────────
// v1: does NOT actually remove the background. It transcodes the clip to a
// web-friendly MP4 so the rest of the pipeline works end to end.
// Replace with Runway or unscreen.io implementation when ready — the real
// provider should still return a web-playable MP4 at outputPath.
const mockService: BackgroundRemovalService = {
  async removeBackground(inputPath: string, outputPath: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 500)); // simulate latency
    transcodeToWebMp4(inputPath, outputPath);
    console.log(`[BG-REMOVAL] mock: transcoded ${inputPath} → ${outputPath}`);
  },
};

// TODO: implement runwayService / unscreenService and switch here
// based on process.env.BG_REMOVAL_PROVIDER
export const backgroundRemoval: BackgroundRemovalService = mockService;
