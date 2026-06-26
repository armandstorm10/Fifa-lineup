import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { RenderJob } from "@lineupai/shared";

const OUTPUT_DIR = path.resolve(process.env.RENDER_OUTPUT_DIR || "./renders");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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
  const props = JSON.stringify(buildCompositionProps(job));
  const remotionDir = path.resolve(__dirname, "../../../remotion");

  // TODO: swap this execSync for a Lambda/Modal invocation in production.
  // The props JSON is the contract — the remote renderer receives the same object.
  const cmd = [
    `npx remotion render`,
    `--config=${remotionDir}/remotion.config.ts`,
    `LineupIntro`,
    `"${outputFile}"`,
    `--props='${props}'`,
    `--log=verbose`,
  ].join(" ");

  console.log(`[RENDERER] running: ${cmd}`);
  execSync(cmd, { cwd: remotionDir, stdio: "inherit" });

  return outputFile;
}
