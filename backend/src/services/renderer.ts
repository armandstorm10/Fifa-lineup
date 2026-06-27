import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { RenderJob } from "@lineupai/shared";

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
    players: job.players.map((p) => ({
      ...p,
      clipPath: toPublicUrl(p.clipPath),
      processedClipPath: p.processedClipPath ? toPublicUrl(p.processedClipPath) : undefined,
    })),
    template: job.template,
    aspectRatio: job.aspectRatio,
    watermark: job.watermark,
    resolution: job.resolution,
  };
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

  // TODO: swap this execSync for a Lambda/Modal invocation in production.
  // The props JSON file is the contract — the remote renderer receives the same object.
  console.log(`[RENDERER] running: ${cmd}`);
  try {
    // execSync always runs through a shell (cmd.exe on Windows), so the .cmd
    // shim resolves correctly here — unlike execFileSync, which throws EINVAL.
    execSync(cmd, { cwd: remotionDir, stdio: "inherit" });
  } finally {
    fs.rmSync(propsFile, { force: true });
  }

  return outputFile;
}
