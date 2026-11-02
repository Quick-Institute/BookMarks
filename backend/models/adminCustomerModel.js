import pool from "../config/db.js";

const customerFields = `
  a.account_id,
  a.full_name,
  a.email,
  a.phone,
  a.role,
  a.is_active,
  a.created_at,
  a.updated_at,
  COUNT(co.order_id)::int AS order_count,
  COALESCE(SUM(co.total), 0)::numeric AS total_spent
`;

export async function getAdminCustomers() {
  const result = await pool.query(`
    SELECT ${customerFields}
    FROM account a
    LEFT JOIN customer_order co
      ON co.account_id = a.account_id
    WHERE a.role = 'customer'
    GROUP BY a.account_id
    ORDER BY a.created_at DESC, a.account_id DESC
  `);

  return result.rows;
}

export async function getAdminCustomerById(id) {
  const result = await pool.query(
    `
    SELECT ${customerFields}
    FROM account a
    LEFT JOIN customer_order co
      ON co.account_id = a.account_id
    WHERE a.account_id = $1
      AND a.role = 'customer'
    GROUP BY a.account_id
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function getAdminCustomerOrders(id) {
  const result = await pool.query(
    `
    SELECT
      co.order_id,
      co.placed_at,
      co.total,
      co.status,
      co.payment_method,
      co.delivery_method,
      co.recipient_name,
      co.delivery_phone,
      co.delivery_address,
      COALESCE(
        STRING_AGG(
          oi.book_title || ' × ' || oi.quantity,
          ', ' ORDER BY oi.order_item_id
        ),
        ''
      ) AS books
    FROM customer_order co
    LEFT JOIN order_item oi
      ON oi.order_id = co.order_id
    WHERE co.account_id = $1
    GROUP BY co.order_id
    ORDER BY co.placed_at DESC, co.order_id DESC
    `,
    [id]
  );

  return result.rows;
}

export async function setAdminCustomerStatus(id, isActive) {
  const result = await pool.query(
    `
    UPDATE account
    SET is_active = $2,
        updated_at = NOW()
    WHERE account_id = $1
      AND role = 'customer'
    RETURNING account_id
    `,
    [id, isActive]
  );

  return result.rowCount > 0;
}
