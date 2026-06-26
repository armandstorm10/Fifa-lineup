import "dotenv/config";
import express from "express";
import cors from "cors";
import { jobsRouter } from "./routes/jobs";
import { uploadRouter } from "./routes/upload";
import { renderRouter } from "./routes/render";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve rendered videos statically
app.use("/renders", express.static(process.env.RENDER_OUTPUT_DIR || "./renders"));
app.use("/uploads", express.static(process.env.LOCAL_STORAGE_PATH || "./uploads"));

app.use("/api/jobs", jobsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/render", renderRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`LineupAI backend running on http://localhost:${PORT}`);
});
