import { useEffect, useState } from "react";
import {
  Link, NavLink, useNavigate, useParams,
} from "react-router-dom";
import {
  Search, UserRound, Menu, X, ArrowLeft,
  UserCheck, UserX, Mail, Phone, CalendarDays,
  ShoppingBag,
} from "lucide-react";
import Footer from "./Footer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const date = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

export default function AdminCustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/admin/customers/${id}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load customer."
          );
        }

        setCustomer(data.customer);
        setOrders(data.orders || []);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id]);

  async function changeStatus() {
    if (!customer || saving) return;

    const next = !customer.is_active;
    const action = next ? "activate" : "deactivate";

    if (!window.confirm(
      `Are you sure you want to ${action} ${customer.full_name}?`
    )) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/customers/${id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: next }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not change account status."
        );
      }

      setCustomer(data.customer);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-dashboard admin-customer-details-page">
      <header className="site-header admin-site-header">
        <nav className="navbar">
          <Link to="/admin-dashboard" className="nav-logo">
            BOOK<span>MARKS</span>
          </Link>

          <div className={`nav-links ${mobileOpen ? "open" : ""}`}>
            <NavLink to="/admin/books" onClick={() => setMobileOpen(false)}>
              Books
            </NavLink>
            <NavLink to="/admin/customers" onClick={() => setMobileOpen(false)}>
              Customers
            </NavLink>
            <NavLink to="/admin/restock" onClick={() => setMobileOpen(false)}>
              Restock Books
            </NavLink>
            <NavLink to="/admin/orders" onClick={() => setMobileOpen(false)}>
              Orders
            </NavLink>
          </div>

          <form className="nav-search-form" onSubmit={(e) => {
            e.preventDefault();
            navigate(`/admin/books?search=${encodeURIComponent(navQuery)}`);
          }}>
            <input
              className="nav-search-input"
              placeholder="Search books..."
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
            />
            <button type="submit" className="nav-search-btn" aria-label="Search books">
              <Search size={24} />
            </button>
          </form>

          <div className="nav-icons">
            <Link to="/admin/profile" className="profile-link">
              <UserRound size={29} />
              <span>My Profile</span>
            </Link>
          </div>

          <button type="button" className="hamburger"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </nav>
      </header>

      <main className="admin-main">
        <div className="admin-page-heading">
          <p>BOOKMARKS ADMINISTRATION</p>
          <h1>Customer Details</h1>
          <span>Account information and purchase history.</span>
        </div>

        <Link to="/admin/customers" className="admin-book-back">
          <ArrowLeft size={18} /> Back to Customers
        </Link>

        {loading && <p>Loading customer...</p>}

        {!loading && !customer && error && (
          <p role="alert">{error}</p>
        )}

        {!loading && customer && (
          <>
            <section className="admin-section">
              <div className="admin-section-heading">
                <h2>{customer.full_name}</h2>
                <span>
                  Customer ID: {customer.account_id}
                </span>
              </div>

              <div className="admin-customer-profile">
                <div className="admin-customer-profile-top">
                  <div className="admin-customer-avatar">
                    {customer.full_name?.charAt(0).toUpperCase() || "C"}
                  </div>
                  <div>
                    <h3>{customer.full_name}</h3>
                    <span className={`admin-customer-status ${
                      customer.is_active ? "active" : "inactive"
                    }`}>
                      {customer.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="admin-customer-info-grid">
                  <div>
                    <Mail size={17} />
                    <span>Email</span>
                    <strong>{customer.email}</strong>
                  </div>
                  <div>
                    <Phone size={17} />
                    <span>Phone</span>
                    <strong>{customer.phone || "Not provided"}</strong>
                  </div>
                  <div>
                    <CalendarDays size={17} />
                    <span>Registered</span>
                    <strong>{date(customer.created_at)}</strong>
                  </div>
                  <div>
                    <ShoppingBag size={17} />
                    <span>Total Orders</span>
                    <strong>{customer.order_count}</strong>
                  </div>
                  <div>
                    <span>Total Spent</span>
                    <strong>{money(customer.total_spent)}</strong>
                  </div>
                </div>

                <div className="admin-customer-profile-actions">
                  <button
                    type="button"
                    disabled={saving}
                    className={customer.is_active
                      ? "admin-customer-deactivate"
                      : "admin-customer-activate"}
                    onClick={changeStatus}
                  >
                    {customer.is_active
                      ? <UserX size={18} />
                      : <UserCheck size={18} />}
                    {saving
                      ? "Updating..."
                      : customer.is_active
                      ? "Deactivate Customer"
                      : "Activate Customer"}
                  </button>
                </div>

                {error && <p role="alert" className="admin-book-error">{error}</p>}
                {message && <p role="status" className="admin-book-success">{message}</p>}
              </div>
            </section>

            <section className="admin-section">
              <div className="admin-section-heading">
                <h2>Order History</h2>
                <span>{orders.length} order(s)</span>
              </div>

              <div className="admin-books-panel">
                <div className="admin-books-table-scroll">
                  <table className="admin-books-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Books</th>
                        <th>Delivery</th>
                        <th>Status</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.order_id}>
                          <td>#{order.order_id}</td>
                          <td>{date(order.placed_at)}</td>
                          <td className="admin-customer-books-cell">
                            {order.books || "—"}
                          </td>
                          <td>{order.delivery_method || "—"}</td>
                          <td>
                            <span className="admin-customer-order-status">
                              {order.status}
                            </span>
                          </td>
                          <td className="admin-books-nowrap">
                            {money(order.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {orders.length === 0 && (
                    <p className="admin-books-message">
                      This customer has no linked orders.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
