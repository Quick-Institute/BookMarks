import pool from "../config/db.js";

// Overall dashboard figures
export const getSalesSummary = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total_orders,
      COALESCE(SUM(subtotal), 0) AS total_revenue,
      COALESCE(AVG(subtotal), 0) AS average_order_value
    FROM customer_order
    WHERE status <> 'cancelled'
  `);

  return result.rows[0];
};

// Daily order revenue for the last 30 days
export const getDailySales = async () => {
  const result = await pool.query(`
    SELECT
      DATE(placed_at) AS sale_date,
      COUNT(*)::int AS total_orders,
      COALESCE(SUM(subtotal), 0) AS revenue
    FROM customer_order
    WHERE placed_at >= CURRENT_DATE - INTERVAL '29 days'
      AND status <> 'cancelled'
    GROUP BY DATE(placed_at)
    ORDER BY sale_date ASC
  `);

  return result.rows;
};

// Number of orders in each status
export const getOrdersByStatus = async () => {
  const result = await pool.query(`
    SELECT
      status,
      COUNT(*)::int AS total_orders
    FROM customer_order
    GROUP BY status
    ORDER BY total_orders DESC
  `);

  return result.rows;
};

// Five books with the highest quantity ordered
export const getBestSellingBooks = async () => {
  const result = await pool.query(`
    SELECT
      oi.book_id,
      oi.book_title,
      SUM(oi.quantity)::int AS copies_sold,
      COALESCE(
        SUM(oi.unit_price * oi.quantity), 0
      ) AS revenue
    FROM order_item oi
    INNER JOIN customer_order co
      ON co.order_id = oi.order_id
    WHERE co.status <> 'cancelled'
    GROUP BY oi.book_id, oi.book_title
    ORDER BY copies_sold DESC, revenue DESC
    LIMIT 5
  `);

  return result.rows;
};
