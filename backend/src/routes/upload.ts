import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.resolve(process.env.LOCAL_STORAGE_PATH || "./uploads");

// Use diskStorage (not `dest`) so the saved file KEEPS its extension. Without it
// multer writes an extensionless file, which breaks Content-Type detection and
// leaves ffmpeg/Remotion unable to identify the format (e.g. a .MOV upload).
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename(_req, file, cb) {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are accepted"));
    }
  },
});

export const uploadRouter = Router();

uploadRouter.post("/clip", upload.single("clip"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const clipKey = `clips/${uuidv4()}${path.extname(req.file.originalname)}`;
  // In local mode the file is already at req.file.path; just return the key
  res.json({ clipPath: req.file.path, clipKey });
});
