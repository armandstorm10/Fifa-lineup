import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { RenderJob } from "@lineupai/shared";

const OUTPUT_DIR = path.resolve(process.env.RENDER_OUTPUT_DIR || "./renders");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Path to the remotion binary, RELATIVE to the remotion workspace dir (which is
// passed to execSync as cwd). Keeping this relative avoids putting an absolute
// path with spaces (e.g. "C:\Users\Armand Storm\...") as the command token —
// cmd.exe mangles a quoted, space-containing leading token and fails with
// "The system cannot find the path specified". On Windows the binary is a .cmd shim.
//
// npm workspaces usually HOISTS the binary to the root node_modules/.bin (i.e.
// ../node_modules/.bin from here), but it may also live in the local workspace's
// node_modules/.bin. Prefer whichever actually exists.
function remotionBinRelative(remotionDir: string): string {
  const ext = process.platform === "win32" ? ".cmd" : "";
  const name = `remotion${ext}`;
  const hoisted = path.join("..", "node_modules", ".bin", name); // root (workspaces)
  const local = path.join("node_modules", ".bin", name);          // local workspace
  return fs.existsSync(path.join(remotionDir, hoisted)) ? hoisted : local;
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
  const bin = remotionBinRelative(remotionDir);

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
