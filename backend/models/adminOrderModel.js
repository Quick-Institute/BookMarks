import pool from "../config/db.js";

export async function findAllAdminOrders() {
  const result = await pool.query(`
    SELECT
      co.order_id,
      co.account_id,
      co.guest_email,
      co.recipient_name,
      co.delivery_phone,
      co.delivery_method,
      co.subtotal,
      co.delivery_fee,
      co.total,
      co.payment_method,
      co.status,
      co.placed_at,
      a.full_name AS account_name,
      a.email AS account_email,
      COALESCE(items.item_count, 0)::int AS item_count
    FROM customer_order co
    LEFT JOIN account a
      ON a.account_id = co.account_id
    LEFT JOIN (
      SELECT order_id, SUM(quantity)::int AS item_count
      FROM order_item
      GROUP BY order_id
    ) items ON items.order_id = co.order_id
    ORDER BY co.placed_at DESC, co.order_id DESC
  `);

  return result.rows;
}

export async function findAdminOrderById(orderId) {
  const orderResult = await pool.query(
    `
    SELECT
      co.*,
      a.full_name AS account_name,
      a.email AS account_email
    FROM customer_order co
    LEFT JOIN account a
      ON a.account_id = co.account_id
    WHERE co.order_id = $1
    `,
    [orderId]
  );

  const order = orderResult.rows[0];

  if (!order) return null;

  const itemsResult = await pool.query(
    `
    SELECT
      order_item_id,
      book_id,
      book_title,
      unit_price,
      quantity,
      (unit_price * quantity) AS line_total
    FROM order_item
    WHERE order_id = $1
    ORDER BY order_item_id
    `,
    [orderId]
  );

  return {
    ...order,
    items: itemsResult.rows,
  };
}

export async function transitionAdminOrderStatus(
  orderId,
  expectedStatus,
  nextStatus
) {
  const result = await pool.query(
    `
    UPDATE customer_order
    SET status = $3
    WHERE order_id = $1
      AND status = $2
    RETURNING order_id, status
    `,
    [orderId, expectedStatus, nextStatus]
  );

  return result.rows[0] || null;
}
