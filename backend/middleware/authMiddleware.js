import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
    const token = req.cookies?.auth_token;

    if (!token) {
        return res.status(401).json({
            message:"Please log in first."
        });
    }

    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        req.accountId = payload.accountId;
        next();
    } catch {
        return res.status(401).json({
            message: "Your session has expired. Please login again."
        });
    }
};


export const optionalAuth = (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    req.accountId = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.accountId = payload.accountId;
    next();
  } catch {
    return res.status(401).json({
      message: "Your session has expired. Please log in again or log out to continue as a guest.",
    });
  }
};


import pool from "../config/db.js";

// Allow only active customer accounts
export const requireCustomer = async (req, res, next) => {
  try {
    const result = await pool.query(
      `
        SELECT account_id, role, is_active
        FROM account
        WHERE account_id = $1
      `,
      [req.accountId]
    );

    const account = result.rows[0];

    if (!account || !account.is_active) {
      return res.status(403).json({
        message: "Your account is not active.",
      });
    }

    if (account.role !== "customer") {
      return res.status(403).json({
        message: "Only customers can rate books.",
      });
    }

    next();

  } catch (error) {
    console.error("Customer authorization error:", error);

    return res.status(500).json({
      message: "Unable to verify customer access.",
    });
  }
};


export const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      `
        SELECT account_id, role, is_active
        FROM account
        WHERE account_id = $1
      `,
      [req.accountId]
    );

    const account = result.rows[0];

    if (!account || !account.is_active) {
      return res.status(403).json({
        message: "Your account is not active.",
      });
    }

    if (account.role !== "admin") {
      return res.status(403).json({
        message: "Administrator access required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      message: "Unable to verify administrator access.",
    });
  }
};

