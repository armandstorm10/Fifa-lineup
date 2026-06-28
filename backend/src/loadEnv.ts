import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// The backend runs with cwd = backend/ (npm workspace), but .env lives at the
// REPO ROOT. dotenv's default (`import "dotenv/config"`) only checks cwd, so it
// would silently load nothing. Resolve the root .env explicitly. This module
// must be imported FIRST (before anything that reads process.env at load time).
const candidates = [
  path.resolve(__dirname, "../../.env"), // repo root (from src/ or dist/)
  path.resolve(process.cwd(), ".env"),   // fallback: backend/.env
];

const envPath = candidates.find((p) => fs.existsSync(p));
if (envPath) {
  dotenv.config({ path: envPath });
  console.log(`[ENV] loaded ${envPath}`);
} else {
  console.warn(`[ENV] no .env found (looked in: ${candidates.join(", ")})`);
}
console.log(`[ENV] BG_REMOVAL_PROVIDER=${process.env.BG_REMOVAL_PROVIDER ?? "(unset)"}`);
console.log(`[ENV] REPLICATE_API_TOKEN=${process.env.REPLICATE_API_TOKEN ? "set" : "(unset)"}`);
