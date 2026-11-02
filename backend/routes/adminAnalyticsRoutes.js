import express from "express";

import {
  getDashboardAnalytics,
} from "../controllers/adminAnalyticsController.js";

import {
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/analytics",
  requireAuth,
  requireAdmin,
  getDashboardAnalytics
);

export default router;
