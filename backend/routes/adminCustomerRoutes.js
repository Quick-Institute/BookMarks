
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

import {
  listCustomers,
  showCustomer,
  updateCustomerStatus,
} from "../controllers/adminCustomerController.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", listCustomers);
router.get("/:id", showCustomer);
router.patch("/:id/status", updateCustomerStatus);

export default router;
