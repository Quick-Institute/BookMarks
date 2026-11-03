import { sendOrderConfirmation } from "../services/emailService.js";
import { createOrder, findOrdersByAccountId } from "../models/orderModel.js";
import { findAccountById } from "../models/accountModel.js";

export const placeOrder = async (req, res) => {
  try {
    const { customer, items, deliveryMethod } = req.body ?? {};
    if (!customer || typeof customer !== "object") {
      return res.status(400).json({ message: "Customer details are required." });
    }
    const { email, firstName, lastName, country, street, apartment, city, phone } = customer;
    if ([email, firstName, lastName, country, street, city, phone].some(
      (value) => typeof value !== "string" || !value.trim()
    )) {
      return res.status(400).json({ message: "Please complete all required billing fields." });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      return res.status(400).json({ message: "Your cart must contain 1 to 100 items." });
    }
    if (!["home", "pickup"].includes(deliveryMethod)) {
      return res.status(400).json({ message: "Invalid delivery method." });
    }
    const seenIds = new Set();
    const validatedRequests = [];
    for (const item of items) {
      const bookId = Number(item?.id);
      const quantity = item?.quantity;
      if (!Number.isSafeInteger(bookId) || bookId < 1 ||
          !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100 ||
          seenIds.has(bookId)) {
        return res.status(400).json({ message: "Your cart contains an invalid book or quantity." });
      }
      seenIds.add(bookId);
      validatedRequests.push({ id: bookId, quantity });
    }
    let accountId = null;
    if (req.accountId != null) {
      const account = await findAccountById(req.accountId);
      if (!account) {
        return res.status(401).json({ message: "Account unavailable. Please log in again." });
      }
      accountId = account.account_id;
    }
    const recipientName = `${firstName.trim()} ${lastName.trim()}`;
    const address = [street.trim(), typeof apartment === "string" ? apartment.trim() : "",
      city.trim(), country.trim()].filter(Boolean).join(", ");
    // Database verifies active books, locks stock, calculates prices, and commits the order.
    const savedOrder = await createOrder({
      accountId, email: cleanEmail, recipientName, phone: phone.trim(),
      address, deliveryMethod, items: validatedRequests,
    });
    void Promise.resolve().then(() => sendOrderConfirmation({
      order_id: savedOrder.order_id,
      email: cleanEmail,
      recipient_name: recipientName,
      delivery_address: address,
      delivery_method: deliveryMethod,
      subtotal: savedOrder.subtotal,
      delivery_fee: savedOrder.deliveryFee,
      total: savedOrder.total,
      items: savedOrder.items.map((item) => ({
        book_title: item.title, unit_price: item.price, quantity: item.quantity,
      })),
    })).catch((mailError) => {
      console.error(`Order ${savedOrder.order_id} confirmation email failed:`, mailError);
    });
    return res.status(201).json({
      message: "Order placed successfully!",
      order: {
        orderId: savedOrder.order_id, placedAt: savedOrder.placed_at,
        email: cleanEmail, subtotal: savedOrder.subtotal,
        deliveryFee: savedOrder.deliveryFee, total: savedOrder.total,
        items: savedOrder.items,
      },
    });
  } catch (error) {
    console.error("Place order error:", error);
    return res.status(error.status === 400 ? 400 : 500).json({
      message: error.status === 400 ? error.message : "Unable to place order. Please try again.",
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const account = await findAccountById(req.accountId);
    if (!account) return res.status(401).json({ message: "Account not found or inactive." });
    const orders = await findOrdersByAccountId(account.account_id);
    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Load orders error:", error);
    return res.status(500).json({ message: "Unable to load your orders." });
  }
};
