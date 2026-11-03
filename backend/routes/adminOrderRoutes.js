import express from "express";
import {
  requireAuth,
} from "../middleware/authMiddleware.js";
import {
  requireAdmin,
} from "../middleware/adminMiddleware.js";

import {
  getAllAdminOrders,
  getAdminOrder,
  updateAdminOrderStatus,
} from "../controllers/adminOrderController.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", getAllAdminOrders);
router.get("/:id", getAdminOrder);
router.patch("/:id/status", updateAdminOrderStatus);

export default router;
