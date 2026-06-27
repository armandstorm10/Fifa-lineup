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

// Props passed into the Remotion composition as JSON
function buildCompositionProps(job: RenderJob): object {
  return {
    players: job.players,
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
