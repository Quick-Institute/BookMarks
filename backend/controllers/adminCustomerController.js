
import {
  getAdminCustomers,
  getAdminCustomerById,
  getAdminCustomerOrders,
  setAdminCustomerStatus,
} from "../models/adminCustomerModel.js";

const validId = (id) =>
  /^[1-9]\d*$/.test(String(id)) &&
  Number.isSafeInteger(Number(id));

function serverError(res, error) {
  console.error("Admin customer error:", error);
  return res.status(500).json({
    message: "Unable to complete customer operation.",
  });
}

export async function listCustomers(req, res) {
  try {
    const customers = await getAdminCustomers();
    return res.json({ customers });
  } catch (error) {
    return serverError(res, error);
  }
}

export async function showCustomer(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid customer ID.",
    });
  }

  try {
    const customer = await getAdminCustomerById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    const orders = await getAdminCustomerOrders(req.params.id);

    return res.json({ customer, orders });
  } catch (error) {
    return serverError(res, error);
  }
}

export async function updateCustomerStatus(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid customer ID.",
    });
  }

  if (typeof req.body?.is_active !== "boolean") {
    return res.status(400).json({
      message: "is_active must be true or false.",
    });
  }

  try {
    const updated = await setAdminCustomerStatus(
      req.params.id,
      req.body.is_active
    );

    if (!updated) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    const customer = await getAdminCustomerById(req.params.id);

    return res.json({
      message: customer.is_active
        ? "Customer activated successfully."
        : "Customer deactivated successfully.",
      customer,
    });
  } catch (error) {
    return serverError(res, error);
  }
}
