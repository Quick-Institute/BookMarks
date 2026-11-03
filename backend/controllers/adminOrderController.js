import { sendOrderStatusEmail } from "../services/emailService.js";
import {
  findAllAdminOrders,
  findAdminOrderById,
  transitionAdminOrderStatus,
} from "../models/adminOrderModel.js";

export const ORDER_TRANSITIONS = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["dispatched", "cancelled"],
  dispatched: ["delivered"],
  delivered: [],
  cancelled: [],
};

const isValidId = (id) =>
  /^[1-9]\d*$/.test(String(id)) &&
  Number.isSafeInteger(Number(id));

export async function getAllAdminOrders(req, res) {
  try {
    const orders = await findAllAdminOrders();
    return res.json({ orders });
  } catch (error) {
    console.error("Get admin orders error:", error);
    return res.status(500).json({
      message: "Unable to load orders.",
    });
  }
}

export async function getAdminOrder(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid order ID.",
    });
  }

  try {
    const order = await findAdminOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    return res.json({
      order,
      allowedNextStatuses: ORDER_TRANSITIONS[order.status] || [],
    });
  } catch (error) {
    console.error("Get admin order error:", error);
    return res.status(500).json({
      message: "Unable to load order details.",
    });
  }
}

export async function updateAdminOrderStatus(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid order ID.",
    });
  }

  const { status, expectedStatus } = req.body || {};

  if (
    typeof status !== "string" ||
    typeof expectedStatus !== "string"
  ) {
    return res.status(400).json({
      message: "Status and expectedStatus are required.",
    });
  }

  try {
    const currentOrder = await findAdminOrderById(req.params.id);

    if (!currentOrder) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (currentOrder.status !== expectedStatus) {
      return res.status(409).json({
        message: "Order status has changed. Refresh and try again.",
      });
    }

    const allowed = ORDER_TRANSITIONS[currentOrder.status] || [];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message:
          `Cannot change an order from ${currentOrder.status} to ${status}.`,
        allowedNextStatuses: allowed,
      });
    }

    const updated = await transitionAdminOrderStatus(
      req.params.id,
      expectedStatus,
      status
    );

    if (!updated) {
      return res.status(409).json({
        message: "Order was updated elsewhere. Refresh and try again.",
      });
    }

    const order = await findAdminOrderById(req.params.id);

    // Send only after the database accepted the status transition.
    // A failed email must not undo or misreport the successful status update.
    if (order) {
      const recipientEmail = order.guest_email || order.account_email;
      if (recipientEmail) {
        void sendOrderStatusEmail({
          order_id: order.order_id,
          email: recipientEmail,
          recipient_name: order.recipient_name,
          total: order.total,
          status: order.status,
        }).catch((mailError) => {
          console.error(`Order ${order.order_id} status email failed:`, mailError);
        });
      } else {
        console.warn(`Order ${req.params.id}: no recipient email for status notification.`);
      }
    }

    return res.json({
      message: `Order status updated to ${status}.`,
      order,
      allowedNextStatuses: ORDER_TRANSITIONS[status] || [],
    });
  } catch (error) {
    console.error("Update admin order error:", error);
    return res.status(500).json({
      message: "Unable to update order status.",
    });
  }
}
