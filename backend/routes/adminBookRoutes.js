
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

const uploadDirectory = path.resolve("uploads", "book-covers");
fs.mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirectory),
    filename: (_req, file, cb) => {
      const extensions = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
      cb(null, `${randomUUID()}${extensions[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG and WebP images are allowed."));
    }
    cb(null, true);
  },
});
const uploadCoverMiddleware = (req, res, next) => {
  upload.single("cover")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller." : err.message });
    next();
  });
};

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

import {
  requireAdmin,
} from "../middleware/adminMiddleware.js";

import {
  index,
  options,
  show,
  update,
  uploadCover,
  remove,
  restockIndex,
  restockBook,
} from "../controllers/adminBookController.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", index);
router.get("/options", options);

// Must appear before /:id
router.get("/restock", restockIndex);

router.get("/:id", show);
router.put("/:id", update);
router.post("/:id/cover", uploadCoverMiddleware, uploadCover);
router.delete("/:id", remove);

router.patch("/:id/restock", restockBook);

export default router;
