import {
  getSalesSummary,
  getDailySales,
  getOrdersByStatus,
  getBestSellingBooks,
} from "../models/adminAnalyticsModel.js";

export const getDashboardAnalytics = async (req, res) => {
  try {
    const [
      summary,
      dailySales,
      ordersByStatus,
      bestSellingBooks,
    ] = await Promise.all([
      getSalesSummary(),
      getDailySales(),
      getOrdersByStatus(),
      getBestSellingBooks(),
    ]);

    return res.status(200).json({
      summary,
      dailySales,
      ordersByStatus,
      bestSellingBooks,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    return res.status(500).json({
      message: "Unable to load dashboard analytics.",
    });
  }
};
