import fs from "fs";

// ── Interface ─────────────────────────────────────────────────────────────────
// To swap providers: implement this interface and change the export below.
// Input: path to original video clip
// Output: path to processed clip (background removed / keyed)
export interface BackgroundRemovalService {
  removeBackground(inputPath: string, outputPath: string): Promise<void>;
}

// ── Mock implementation ───────────────────────────────────────────────────────
// Simulates a ~2 second API call then copies the file unchanged.
// Replace with Runway or unscreen.io implementation when ready.
const mockService: BackgroundRemovalService = {
  async removeBackground(inputPath: string, outputPath: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 2000)); // simulate latency
    fs.copyFileSync(inputPath, outputPath);
    console.log(`[BG-REMOVAL] mock: copied ${inputPath} → ${outputPath}`);
  },
};

// TODO: implement runwayService / unscreenService and switch here
// based on process.env.BG_REMOVAL_PROVIDER
export const backgroundRemoval: BackgroundRemovalService = mockService;
