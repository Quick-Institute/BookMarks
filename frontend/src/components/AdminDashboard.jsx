import Footer from "./Footer"; 
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, UserRound, Menu, X } from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const COLORS = [
  "#14213d",
  "#1f4e79",
  "#6d91b3",
  "#a7bed3",
  "#d4e0ea",
];

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  const date = String(value).slice(0, 10);
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}`;
};

export default function AdminDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restockBooks, setRestockBooks] = useState([]);
  const [restockLoading, setRestockLoading] = useState(true);
  const [restockError, setRestockError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/admin/analytics`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please sign in to view analytics.");
          }

          if (response.status === 403) {
            throw new Error(
              "Administrator access is required."
            );
          }

          throw new Error("Unable to load sales analytics.");
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => controller.abort();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();

    if (searchTerm.trim()) {
      navigate(
        `/admin/books?search=${encodeURIComponent(
          searchTerm.trim()
        )}`
      );

      setIsOpen(false);
    }
  };

  const summary = analytics?.summary || {};

  const dailySales = (analytics?.dailySales || []).map(
    (row) => ({
      date: formatDate(row.sale_date),
      revenue: Number(row.revenue),
      orders: Number(row.total_orders),
    })
  );

  const orderStatuses = (
    analytics?.ordersByStatus || []
  ).map((row) => ({
    name: row.status,
    value: Number(row.total_orders),
  }));

  const bestSellingBooks = (
    analytics?.bestSellingBooks || []
  ).map((row) => ({
    title: row.book_title,
    copies: Number(row.copies_sold),
  }));

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRestockBooks() {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/books/restock`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Could not load restock books.");
        }

        const data = await response.json();

        setRestockBooks(
          (data.books || []).sort(
            (a, b) =>
              Number(a.stock_quantity) - Number(b.stock_quantity)
          )
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setRestockError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setRestockLoading(false);
        }
      }
    }

    fetchRestockBooks();
    return () => controller.abort();
  }, []);
  return (
    <div className="admin-dashboard">
      <header className="site-header admin-site-header">
        <nav className="navbar">
          <Link to="/admin-dashboard" className="nav-logo">
            BOOK<span>MARKS</span>
          </Link>

          <div className={`nav-links ${isOpen ? "open" : ""}`}>
            <NavLink
              to="/admin/books"
              onClick={() => setIsOpen(false)}
            >
              Books
            </NavLink>

            <NavLink
              to="/admin/customers"
              onClick={() => setIsOpen(false)}
            >
              Customers
            </NavLink>

            <NavLink
              to="/admin/restock"
              onClick={() => setIsOpen(false)}
            >
              Restock Books
            </NavLink>

            <NavLink
              to="/admin/orders"
              onClick={() => setIsOpen(false)}
            >
              Orders
            </NavLink>
          </div>

          <form
            className="nav-search-form"
            onSubmit={handleSearch}
          >
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              className="nav-search-input"
            />

            <button
              type="submit"
              className="nav-search-btn"
              aria-label="Search books"
            >
              <Search size={24} />
            </button>
          </form>

          <div className="nav-icons">
            <Link to="/admin/profile" className="profile-link">
              <UserRound size={29} />
              <span>My Profile</span>
            </Link>
          </div>

          <button
            type="button"
            className="hamburger"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X size={26} />
            ) : (
              <Menu size={26} />
            )}
          </button>
        </nav>
      </header>

      <main className="admin-main">
        <div className="admin-page-heading">
          <p>BOOKMARKS ADMINISTRATION</p>
          <h1>Dashboard Overview</h1>
          <span>
            Manage your bookstore in one place.
          </span>
        </div>

        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>Sales Data</h2>
            <span>Sales performance overview</span>
          </div>

          {loading && (
            <div className="admin-analytics-message">
              Loading sales analytics...
            </div>
          )}

          {!loading && error && (
            <div
              className="admin-analytics-message"
              role="alert"
            >
              {error}
            </div>
          )}

          {!loading && !error && analytics && (
            <div className="admin-analytics">
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <span>Total Order Revenue</span>
                  <h3>{money(summary.total_revenue)}</h3>
                  <p>Excluding delivery fees</p>
                </div>

                <div className="admin-stat-card">
                  <span>Total Orders</span>
                  <h3>{summary.total_orders || 0}</h3>
                  <p>Non-cancelled orders</p>
                </div>

                <div className="admin-stat-card">
                  <span>Average Order Value</span>
                  <h3>
                    {money(summary.average_order_value)}
                  </h3>
                  <p>Average book subtotal</p>
                </div>
              </div>

              <div className="admin-charts-grid">
                <div className="admin-chart-card admin-chart-wide">
                  <div className="admin-chart-title">
                    <h3>Daily Order Revenue</h3>
                    <p>Last 30 days</p>
                  </div>

                  {dailySales.length === 0 ? (
                    <p>No sales data available.</p>
                  ) : (
                    <div className="admin-chart-area">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <LineChart data={dailySales}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e0e8f0"
                          />
                          <XAxis dataKey="date" />
                          <YAxis
                            width={75}
                            tickFormatter={(value) =>
                              value.toLocaleString()
                            }
                          />
                          <Tooltip
                            formatter={(value) =>
                              money(value)
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            name="Order Revenue"
                            stroke="#1f4e79"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="admin-chart-card">
                  <div className="admin-chart-title">
                    <h3>Daily Orders</h3>
                    <p>Number of orders placed</p>
                  </div>

                  {dailySales.length === 0 ? (
                    <p>No order data available.</p>
                  ) : (
                    <div className="admin-chart-area">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart data={dailySales}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e0e8f0"
                          />
                          <XAxis dataKey="date" />
                          <YAxis
                            allowDecimals={false}
                            width={35}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="orders"
                            name="Orders"
                            fill="#1f4e79"
                            radius={[5, 5, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="admin-chart-card">
                  <div className="admin-chart-title">
                    <h3>Order Status</h3>
                    <p>Distribution of all orders</p>
                  </div>

                  {orderStatuses.length === 0 ? (
                    <p>No order statuses available.</p>
                  ) : (
                    <div className="admin-chart-area">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={orderStatuses}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="45%"
                            outerRadius={95}
                            label
                          >
                            {orderStatuses.map(
                              (entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={
                                    COLORS[
                                      index % COLORS.length
                                    ]
                                  }
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="admin-chart-card admin-chart-wide">
                  <div className="admin-chart-title">
                    <h3>Best-Selling Books</h3>
                    <p>Top 5 books by copies ordered</p>
                  </div>

                  {bestSellingBooks.length === 0 ? (
                    <p>No book sales available.</p>
                  ) : (
                    <div className="admin-chart-area">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={bestSellingBooks}
                          layout="vertical"
                          margin={{
                            top: 5,
                            right: 25,
                            left: 10,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e0e8f0"
                          />
                          <XAxis
                            type="number"
                            allowDecimals={false}
                          />
                          <YAxis
                            dataKey="title"
                            type="category"
                            width={145}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) =>
                              value.length > 22
                                ? `${value.slice(0, 22)}...`
                                : value
                            }
                          />
                          <Tooltip />
                          <Bar
                            dataKey="copies"
                            name="Copies Ordered"
                            fill="#14213d"
                            radius={[0, 5, 5, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>Restock List</h2>
            <span>Books requiring attention</span>
          </div>

          <div className="admin-restock-list">
            <div className="admin-restock-header">
              <span>Book</span>
              <span>Available Stock</span>
              <span>Status</span>
            </div>

            {restockLoading ? (
              <div className="admin-restock-empty">
                <p>Loading restock information...</p>
              </div>
            ) : restockError ? (
              <div className="admin-restock-empty">
                <p>{restockError}</p>
              </div>
            ) : restockBooks.length === 0 ? (
              <div className="admin-restock-empty">
                <h3>All Books Are Sufficiently Stocked</h3>
                <p>No books currently need restocking.</p>
              </div>
            ) : (
              restockBooks.map((book) => (
                <Link
                  key={book.id}
                  to="/admin/restock"
                  className="admin-restock-data-row"
                >
                  <span>{book.title}</span>
                  <span>{book.stock_quantity}</span>
                  <span>
                    <span
                      className={
                        Number(book.stock_quantity) === 0
                          ? "admin-stock-badge out"
                          : "admin-stock-badge low"
                      }
                    >
                      {Number(book.stock_quantity) === 0
                        ? "Out of Stock"
                        : "Low Stock"}
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="admin-section" aria-label="Author management">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "18px",
              padding: "24px",
              background: "#ffffff",
              border: "1px solid #e0e8f0",
              borderRadius: "12px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 6px", color: "#14213d" }}>
                Manage Authors
              </h2>
              <p style={{ margin: 0, color: "#64748b" }}>
                Add authors, update biographies, and manage author photographs.
              </p>
            </div>
            <Link
              to="/admin/authors"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 20px",
                background: "#14213d",
                color: "#ffffff",
                borderRadius: "8px",
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Manage Authors →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
