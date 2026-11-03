
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
router.delete("/:id", remove);

router.patch("/:id/restock", restockBook);

export default router;
