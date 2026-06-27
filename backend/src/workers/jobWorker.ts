import path from "path";
import { queue } from "../services/queue";
import { backgroundRemoval } from "../services/backgroundRemoval";
import { renderVideo } from "../services/renderer";

export async function processJob(jobId: string): Promise<void> {
  const job = queue.getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  // Stage 1: processing-clip
  queue.updateJob(jobId, { status: "processing-clip" });
  await new Promise((r) => setTimeout(r, 500));

  // Stage 2: removing-background (per player)
  queue.updateJob(jobId, { status: "removing-background" });
  const processedPlayers = await Promise.all(
    job.players.map(async (player) => {
      const ext = path.extname(player.clipPath);
      const dir = path.dirname(player.clipPath);
      const base = path.basename(player.clipPath, ext);
      // Always .webm — background removal outputs a VP9 WebM (transparent alpha
      // when matting succeeds, opaque on fallback).
      const processedPath = path.join(dir, "_processed", `${base}.webm`);
      await backgroundRemoval.removeBackground(player.clipPath, processedPath);
      return { ...player, processedClipPath: processedPath };
    })
  );
  queue.updateJob(jobId, { players: processedPlayers });

  // Stage 3: compositing
  queue.updateJob(jobId, { status: "compositing" });
  await new Promise((r) => setTimeout(r, 500));

  // Stage 4: rendering
  queue.updateJob(jobId, { status: "rendering" });
  const updatedJob = queue.getJob(jobId)!;
  const outputPath = await renderVideo(updatedJob);

  const outputUrl = `/renders/${path.basename(outputPath)}`;
  queue.updateJob(jobId, { status: "complete", outputPath, outputUrl });
  console.log(`[JOB ${jobId}] complete → ${outputUrl}`);
}
