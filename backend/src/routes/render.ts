import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { RenderJob, Tier, Resolution } from "@lineupai/shared";
import { queue } from "../services/queue";
import { processJob } from "../workers/jobWorker";

export const renderRouter = Router();

function tierToResolution(tier: Tier): Resolution {
  return tier === "individual" ? 1080 : 480;
}

renderRouter.post("/", async (req: Request, res: Response) => {
  const { players, template, aspectRatio, tier } = req.body;

  if (!players || !Array.isArray(players) || players.length === 0) {
    res.status(400).json({ error: "players array is required" });
    return;
  }

  const resolvedTier: Tier = tier || "free";
  const job: RenderJob = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    status: "queued",
    players,
    template: template || "world-cup-gold",
    aspectRatio: aspectRatio || "9:16",
    tier: resolvedTier,
    watermark: resolvedTier === "free",
    resolution: tierToResolution(resolvedTier),
  };

  queue.enqueue(job);

  // Fire-and-forget — UI polls for status
  processJob(job.id).catch((err) => {
    console.error(`[JOB ${job.id}] fatal error:`, err);
    queue.updateJob(job.id, { status: "failed", error: String(err) });
  });

  res.status(202).json({ jobId: job.id });
});
