import pool from "../config/db.js";

export const createOrder = async (order) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Lock rows in a consistent order to prevent overselling and deadlocks.
    const requested = [...order.items].sort((a, b) => a.id - b.id);
    const validatedItems = [];
    for (const item of requested) {
      const result = await client.query(
        `SELECT book_id, title, price, stock_quantity, is_active
         FROM book WHERE book_id = $1 FOR UPDATE`,
        [item.id]
      );
      const book = result.rows[0];
      if (!book || !book.is_active) {
        const error = new Error(`Book ID ${item.id} is unavailable.`);
        error.status = 400;
        throw error;
      }
      if (book.stock_quantity < item.quantity) {
        const error = new Error(`Only ${book.stock_quantity} copies of ${book.title} are available.`);
        error.status = 400;
        throw error;
      }
      const price = Number(book.price);
      validatedItems.push({
        id: Number(book.book_id), title: book.title, price,
        quantity: item.quantity, lineTotal: price * item.quantity,
      });
    }
    const subtotal = validatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const deliveryFee = order.deliveryMethod === "home" ? 450 : 0;
    const total = subtotal + deliveryFee;
    const orderResult = await client.query(
      `INSERT INTO customer_order
       (account_id, guest_email, recipient_name, delivery_phone, delivery_address,
        delivery_method, subtotal, delivery_fee, total, payment_method, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'cod','placed')
       RETURNING order_id, placed_at`,
      [order.accountId, order.email, order.recipientName, order.phone,
       order.address, order.deliveryMethod, subtotal, deliveryFee, total]
    );
    const savedOrder = orderResult.rows[0];
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_item (order_id, book_id, book_title, unit_price, quantity)
         VALUES ($1,$2,$3,$4,$5)`,
        [savedOrder.order_id, item.id, item.title, item.price, item.quantity]
      );
      await client.query(
        `UPDATE book SET stock_quantity = stock_quantity - $1, updated_at = NOW()
         WHERE book_id = $2`,
        [item.quantity, item.id]
      );
    }
    await client.query("COMMIT");
    return { ...savedOrder, subtotal, deliveryFee, total, items: validatedItems };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const findOrdersByAccountId = async (accountId) => {
  const result = await pool.query(
    `SELECT co.order_id, co.placed_at, co.total, co.status,
       COALESCE(STRING_AGG(oi.book_title || ' × ' || oi.quantity,
         ', ' ORDER BY oi.order_item_id), '') AS books
     FROM customer_order co
     LEFT JOIN order_item oi ON oi.order_id = co.order_id
     WHERE co.account_id = $1
     GROUP BY co.order_id, co.placed_at, co.total, co.status
     ORDER BY co.placed_at DESC, co.order_id DESC`,
    [accountId]
  );
  return result.rows;
};
