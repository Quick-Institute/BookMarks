import pool from "../config/db.js";

export async function requireAdmin(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT role, is_active
      FROM account
      WHERE account_id = $1
      `,
      [req.accountId]
    );

    const account = result.rows[0];

    if (
      !account ||
      !account.is_active ||
      account.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Administrator access required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization failed:", error);

    return res.status(500).json({
      message: "Unable to verify administrator access.",
    });
  }
}
