import { RenderJob } from "@lineupai/shared";

// ── Interface ─────────────────────────────────────────────────────────────────
// To switch to BullMQ/Redis: implement this interface and change the export.
export interface QueueService {
  enqueue(job: RenderJob): void;
  getJob(id: string): RenderJob | undefined;
  updateJob(id: string, patch: Partial<RenderJob>): void;
  listJobs(): RenderJob[];
}

// ── In-memory implementation ──────────────────────────────────────────────────
const store = new Map<string, RenderJob>();

const memoryQueue: QueueService = {
  enqueue(job: RenderJob): void {
    store.set(job.id, job);
  },
  getJob(id: string): RenderJob | undefined {
    return store.get(id);
  },
  updateJob(id: string, patch: Partial<RenderJob>): void {
    const existing = store.get(id);
    if (!existing) return;
    store.set(id, { ...existing, ...patch });
  },
  listJobs(): RenderJob[] {
    return Array.from(store.values());
  },
};

// TODO: switch to bullmqQueue when QUEUE_PROVIDER === "bullmq"
export const queue: QueueService = memoryQueue;
