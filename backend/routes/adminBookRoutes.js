import express from "express";

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
  remove,
} from "../controllers/adminBookController.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", index);
router.get("/options", options);
router.get("/:id", show);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
