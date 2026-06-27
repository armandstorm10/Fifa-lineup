import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import ffmpegStatic from "ffmpeg-static";
import Replicate from "replicate";

// ── Interface ─────────────────────────────────────────────────────────────────
// To swap providers: implement this interface and change the export below.
// Input:  path to the original uploaded clip
// Output: a web-playable file at outputPath (a .webm — transparent VP9 alpha when
//         real matting succeeds, otherwise an opaque VP9 fallback).
export interface BackgroundRemovalService {
  removeBackground(inputPath: string, outputPath: string): Promise<void>;
}

if (!ffmpegStatic) {
  throw new Error("ffmpeg-static binary not found — run `npm install`");
}
const FFMPEG = ffmpegStatic;

const UPLOADS_BASE = path.resolve(process.env.LOCAL_STORAGE_PATH || "./uploads");
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

// Map a file under the uploads dir to the http URL the backend serves it at.
function toPublicUrl(filePath: string): string {
  const rel = path.relative(UPLOADS_BASE, path.resolve(filePath)).split(path.sep).join("/");
  return `${PUBLIC_BASE_URL}/uploads/${rel}`;
}

// ── ffmpeg helpers ────────────────────────────────────────────────────────────

// Normalize any input into a standard H.264 MP4. Used to produce the clip we hand
// to Replicate (it needs a clean, widely-decodable input).
function standardizeMp4(inputPath: string, outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  execFileSync(
    FFMPEG,
    ["-y", "-i", inputPath, "-c:v", "libx264", "-pix_fmt", "yuv420p",
     "-preset", "veryfast", "-movflags", "+faststart", "-c:a", "aac", outputPath],
    { stdio: "inherit" }
  );
}

// Chroma-key the green out of RVM's green-screen output and encode a VP9 WebM with
// an alpha plane (yuva420p) that Remotion's <OffthreadVideo transparent> can overlay.
function greenScreenToAlphaWebm(greenScreenPath: string, outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  execFileSync(
    FFMPEG,
    [
      "-y",
      "-i", greenScreenPath,
      // RVM's green-screen background is ~pure green (0x00FF00). similarity/blend
      // can be tuned if edges show spill.
      "-vf", "chromakey=0x00FF00:0.30:0.10,format=yuva420p",
      "-c:v", "libvpx-vp9",
      "-pix_fmt", "yuva420p",
      "-b:v", "2M",
      "-c:a", "libopus",
      outputPath,
    ],
    { stdio: "inherit" }
  );
}

// Opaque VP9 WebM — used by the mock and as the graceful fallback when matting
// is unavailable. Keeps the processed extension (.webm) consistent across paths.
function toOpaqueWebm(inputPath: string, outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  execFileSync(
    FFMPEG,
    ["-y", "-i", inputPath, "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p",
     "-b:v", "2M", "-c:a", "libopus", outputPath],
    { stdio: "inherit" }
  );
}

function verifyOutput(outputPath: string, label: string): void {
  if (!fs.existsSync(outputPath)) {
    throw new Error(`${label}: output not found: ${outputPath}`);
  }
  const { size } = fs.statSync(outputPath);
  if (size === 0) throw new Error(`${label}: produced an empty file: ${outputPath}`);
  console.log(`[BG-REMOVAL] ${label}: ${outputPath} (${size} bytes)`);
}

async function downloadTo(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status}) for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
}

// ── Mock implementation ───────────────────────────────────────────────────────
// Does NOT remove the background — just produces a web-playable (opaque) WebM so
// the pipeline runs end to end without external services.
const mockService: BackgroundRemovalService = {
  async removeBackground(inputPath: string, outputPath: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 500)); // simulate latency
    toOpaqueWebm(inputPath, outputPath);
    verifyOutput(outputPath, "mock (opaque)");
  },
};

// ── Replicate implementation (arielreplicate/robust_video_matting) ────────────
// Flow:
//   1. Standardize the upload to MP4 and place it under /uploads so it has a
//      public http URL (NOTE: PUBLIC_BASE_URL must be reachable by Replicate —
//      in local dev use a tunnel such as ngrok; localhost will NOT work).
//   2. Run the matting model with output_type=green-screen, polling for status.
//   3. Download the green-screen MP4, chroma-key it to a transparent VP9 WebM.
//   4. On any failure, fall back to an opaque WebM so the render still succeeds.
const replicateService: BackgroundRemovalService = {
  async removeBackground(inputPath: string, outputPath: string): Promise<void> {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      console.warn("[BG-REMOVAL] REPLICATE_API_TOKEN not set — falling back to opaque passthrough");
      toOpaqueWebm(inputPath, outputPath);
      verifyOutput(outputPath, "fallback (no token)");
      return;
    }

    const tmpDir = path.join(UPLOADS_BASE, "_tmp");
    const inputForReplicate = path.join(tmpDir, `${path.basename(outputPath, ".webm")}_in.mp4`);
    const greenScreen = path.join(tmpDir, `${path.basename(outputPath, ".webm")}_gs.mp4`);

    try {
      const replicate = new Replicate({ auth: token });

      // 1. Standardize + publish input
      standardizeMp4(inputPath, inputForReplicate);
      const inputUrl = toPublicUrl(inputForReplicate);
      console.log(`[BG-REMOVAL] replicate: input URL ${inputUrl}`);

      // 2. Resolve latest model version, create + poll prediction
      const model = await replicate.models.get("arielreplicate", "robust_video_matting");
      const versionId = model.latest_version?.id;
      if (!versionId) throw new Error("could not resolve robust_video_matting version");

      let prediction = await replicate.predictions.create({
        version: versionId,
        input: { input_video: inputUrl, output_type: "green-screen" },
      });
      console.log(`[BG-REMOVAL] replicate: prediction ${prediction.id} created`);

      while (
        prediction.status !== "succeeded" &&
        prediction.status !== "failed" &&
        prediction.status !== "canceled"
      ) {
        await new Promise((r) => setTimeout(r, 2000));
        prediction = await replicate.predictions.get(prediction.id);
        console.log(`[BG-REMOVAL] replicate: status=${prediction.status}`);
      }

      if (prediction.status !== "succeeded") {
        throw new Error(`prediction ${prediction.status}: ${prediction.error ?? "unknown error"}`);
      }

      // 3. Download green-screen output → chroma-key → transparent WebM
      const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      if (typeof outputUrl !== "string") throw new Error("unexpected prediction output shape");
      await downloadTo(outputUrl, greenScreen);
      greenScreenToAlphaWebm(greenScreen, outputPath);
      verifyOutput(outputPath, "replicate (transparent)");
    } catch (err) {
      // 4. Graceful fallback — keep the pipeline alive with an opaque clip.
      console.error("[BG-REMOVAL] replicate failed, falling back to opaque passthrough:", err);
      toOpaqueWebm(inputPath, outputPath);
      verifyOutput(outputPath, "fallback (after error)");
    } finally {
      fs.rmSync(inputForReplicate, { force: true });
      fs.rmSync(greenScreen, { force: true });
    }
  },
};

// Select provider from env. Defaults to mock so dev works with no keys.
export const backgroundRemoval: BackgroundRemovalService =
  process.env.BG_REMOVAL_PROVIDER === "replicate" ? replicateService : mockService;
