import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import authorRoutes from "./routes/authorRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import adminBookRoutes from "./routes/adminBookRoutes.js";
import adminCustomerRoutes from "./routes/adminCustomerRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow React frontend to communicate with backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Read JSON data sent from frontend
app.use(express.json());

// Read authentication cookies
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/admin", adminAnalyticsRoutes);
app.use("/api/admin/books", adminBookRoutes);
app.use("/api/admin/customers", adminCustomerRoutes);
app.use("/api/admin/orders", adminOrderRoutes);


// Test route
app.get("/", (req, res) => {
  res.json({ message: "BookMarks backend is running!" });
});

app.get("/api/test-db", async (req, res) => {
  try{
    const result = await pool.query("SELECT NOW() AS current_time");

    res.json({ 
      message: "Postgres connected successfully!",
      database_time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Error connecting to Postgres:", error);
    res.status(500).json({ message: "Failed to connect to database" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});