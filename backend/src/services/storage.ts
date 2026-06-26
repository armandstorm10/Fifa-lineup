import fs from "fs";
import path from "path";

// ── Interface ─────────────────────────────────────────────────────────────────
// To switch to S3/R2: implement this interface and change the export below.
export interface StorageService {
  save(localPath: string, key: string): Promise<string>; // returns storage key
  getUrl(key: string): string;
  localPath(key: string): string;
}

// ── Local filesystem implementation ──────────────────────────────────────────
const BASE = path.resolve(process.env.LOCAL_STORAGE_PATH || "./uploads");
fs.mkdirSync(BASE, { recursive: true });

const localStorageService: StorageService = {
  async save(localPath: string, key: string): Promise<string> {
    const dest = path.join(BASE, key);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(localPath, dest);
    return key;
  },
  getUrl(key: string): string {
    return `/uploads/${key}`;
  },
  localPath(key: string): string {
    return path.join(BASE, key);
  },
};

// TODO: switch to s3StorageService or r2StorageService when STORAGE_PROVIDER != "local"
export const storage: StorageService = localStorageService;
