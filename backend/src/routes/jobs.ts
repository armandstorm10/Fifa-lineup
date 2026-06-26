import { Router, Request, Response } from "express";
import { queue } from "../services/queue";

export const jobsRouter = Router();

jobsRouter.get("/:id", (req: Request, res: Response) => {
  const job = queue.getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
});

jobsRouter.get("/", (_req: Request, res: Response) => {
  res.json(queue.listJobs());
});
