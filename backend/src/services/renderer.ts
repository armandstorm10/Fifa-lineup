import { spawn, execFileSync } from "child_process";
import path from "path";
import fs from "fs";
import ffmpegStatic from "ffmpeg-static";
import { RenderJob } from "@lineupai/shared";

// Probe a local media file's duration (seconds) via ffmpeg. ffmpeg-static ships
// no ffprobe, so we run `ffmpeg -i <file>` (which exits non-zero with no output)
// and parse "Duration: HH:MM:SS.cc" from stderr. Returns undefined on failure so
// the composition falls back to its default clip length.
function probeDurationSeconds(filePath: string): number | undefined {
  if (!ffmpegStatic || !fs.existsSync(filePath)) return undefined;
  let stderr = "";
  try {
    execFileSync(ffmpegStatic, ["-i", filePath], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (err) {
    stderr = (err as { stderr?: Buffer | string }).stderr?.toString() ?? "";
  }
  const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return undefined;
  const [, hh, mm, ss] = m;
  const seconds = Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

const OUTPUT_DIR = path.resolve(process.env.RENDER_OUTPUT_DIR || "./renders");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Absolute path to the remotion binary. npm workspaces HOISTS the binary to the
// root node_modules/.bin, so resolve there first (../node_modules/.bin from the
// remotion workspace). Fall back to the local workspace bin only if the hoisted
// one is absent. On Windows the binary is a .cmd shim.
function resolveRemotionBin(remotionDir: string): string {
  const ext = process.platform === "win32" ? ".cmd" : "";
  const name = `remotion${ext}`;
  const hoisted = path.resolve(remotionDir, "..", "node_modules", ".bin", name);
  const local = path.resolve(remotionDir, "node_modules", ".bin", name);
  return fs.existsSync(local) ? local : hoisted;
}

const UPLOADS_BASE = path.resolve(process.env.LOCAL_STORAGE_PATH || "./uploads");
// Base URL the backend is reachable at, so the Remotion render process can fetch
// assets over http (Remotion's <Video>/<Img> reject file:// paths).
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

// Convert a local filesystem clip path (under the uploads dir) into the http URL
// the backend serves it at via app.use("/uploads", express.static(...)).
function toPublicUrl(filePath: string): string {
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  const rel = path.relative(UPLOADS_BASE, path.resolve(filePath)).split(path.sep).join("/");
  return `${PUBLIC_BASE_URL}/uploads/${rel}`;
}

// Props passed into the Remotion composition as JSON.
// Clip paths are rewritten to http URLs so Remotion can fetch them.
function buildCompositionProps(job: RenderJob): object {
  return {
    players: job.players.map((p) => {
      // Probe the LOCAL file that actually plays (processed clip if present),
      // before rewriting paths to http URLs, so the render duration matches it.
      const localClip = p.processedClipPath || p.clipPath;
      const durationInSeconds = p.durationInSeconds ?? probeDurationSeconds(localClip);
      return {
        ...p,
        durationInSeconds,
        clipPath: toPublicUrl(p.clipPath),
        processedClipPath: p.processedClipPath ? toPublicUrl(p.processedClipPath) : undefined,
      };
    }),
    template: job.template,
    aspectRatio: job.aspectRatio,
    watermark: job.watermark,
    resolution: job.resolution,
    // Only enable the crowd-cheer bed if the asset is actually present, so a
    // missing file never hard-fails the render.
    crowdAudio: crowdAudioAvailable(),
  };
}

// The crowd-cheer asset lives in the remotion workspace's public dir.
const CROWD_AUDIO_PATH = path.resolve(
  __dirname,
  "../../../remotion/public/audio/397434_foolboymedia__crowd-cheer.wav"
);
function crowdAudioAvailable(): boolean {
  return fs.existsSync(CROWD_AUDIO_PATH);
}

// Returns the local path of the rendered MP4
export async function renderVideo(job: RenderJob): Promise<string> {
  // Ensure the output directory exists right before rendering. The module-level
  // mkdirSync runs once at import time relative to the then-current cwd, which can
  // differ from the render-time cwd — so re-create defensively here.
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const outputFile = path.join(OUTPUT_DIR, `${job.id}.mp4`);
  const remotionDir = path.resolve(__dirname, "../../../remotion");
  const bin = resolveRemotionBin(remotionDir);

  // Write props to a temp JSON file instead of passing inline. This avoids
  // shell-quoting the JSON (full of double-quotes) on Windows cmd, which is
  // where execFileSync on a .cmd shim throws EINVAL. Remotion's --props
  // accepts a path to a JSON file.
  const propsFile = path.join(OUTPUT_DIR, `${job.id}.props.json`);
  fs.writeFileSync(propsFile, JSON.stringify(buildCompositionProps(job)));

  // bin and config are relative to cwd (remotionDir); output/props are absolute
  // but quoted so spaces (e.g. "C:\Users\Armand Storm\...") survive the shell.
  const cmd = [
    `"${bin}"`,
    "render",
    `--config="remotion.config.ts"`,
    "LineupIntro",
    `"${outputFile}"`,
    `--props="${propsFile}"`,
    // Raise the delayRender timeout so OffthreadVideo has time to fetch/decode
    // the clip over http (default 30s can be tight for larger uploads).
    "--timeout=120000",
    "--log=verbose",
  ].join(" ");

  // TODO: swap this spawn for a Lambda/Modal invocation in production.
  // The props JSON file is the contract — the remote renderer receives the same object.
  //
  // IMPORTANT: this MUST be async (spawn, not execSync). The render's headless
  // browser fetches the uploaded clip over http from THIS same Express server.
  // execSync would block the Node event loop for the whole render, so the server
  // couldn't answer that fetch → "server sent no data" timeout. spawn keeps the
  // loop free to serve the clip while rendering.
  console.log(`[RENDERER] running: ${cmd}`);
  try {
    await new Promise<void>((resolve, reject) => {
      // shell: true runs the .cmd shim correctly on Windows.
      const child = spawn(cmd, { cwd: remotionDir, stdio: "inherit", shell: true });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`remotion render exited with code ${code}`));
      });
    });
  } finally {
    fs.rmSync(propsFile, { force: true });
  }

  return outputFile;
}
