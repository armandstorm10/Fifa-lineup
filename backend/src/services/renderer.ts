import { execFileSync } from "child_process";
import path from "path";
import fs from "fs";
import { RenderJob } from "@lineupai/shared";

const OUTPUT_DIR = path.resolve(process.env.RENDER_OUTPUT_DIR || "./renders");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Resolve the remotion binary from the remotion workspace's node_modules.
// Using execFileSync with the direct binary path avoids npx resolution issues on Windows.
function remotionBin(remotionDir: string): string {
  const ext = process.platform === "win32" ? ".cmd" : "";
  return path.join(remotionDir, "node_modules", ".bin", `remotion${ext}`);
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
  const outputFile = path.join(OUTPUT_DIR, `${job.id}.mp4`);
  const remotionDir = path.resolve(__dirname, "../../../remotion");
  const bin = remotionBin(remotionDir);

  const args = [
    "render",
    `--config=${path.join(remotionDir, "remotion.config.ts")}`,
    "LineupIntro",
    outputFile,
    `--props=${JSON.stringify(buildCompositionProps(job))}`,
    "--log=verbose",
  ];

  // TODO: swap this execFileSync for a Lambda/Modal invocation in production.
  // The props JSON is the contract — the remote renderer receives the same object.
  console.log(`[RENDERER] running: ${bin} ${args.join(" ")}`);
  execFileSync(bin, args, { cwd: remotionDir, stdio: "inherit" });

  return outputFile;
}
