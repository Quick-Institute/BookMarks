import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, UserRound, MapPin, CreditCard,
  Package, CalendarDays, Truck, Menu, X, Search
} from "lucide-react";
import Footer from "./Footer";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TRANSITIONS = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["dispatched", "cancelled"],
  dispatched: ["delivered"],
  delivered: [],
  cancelled: [],
};

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("en-GB") : "—";

const titleCase = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AdminOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrder() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API}/api/admin/orders/${id}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load order.");
        }

        setOrder(data.order);
        setSelectedStatus("");
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadOrder();
    return () => controller.abort();
  }, [id]);

  async function updateStatus() {
    if (!order || !selectedStatus || saving) return;

    const allowed = TRANSITIONS[order.status] || [];
    if (!allowed.includes(selectedStatus)) return;

    if (!window.confirm(
      `Change order #${order.order_id} from ${titleCase(order.status)} ` +
      `to ${titleCase(selectedStatus)}?`
    )) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API}/api/admin/orders/${id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
            expectedStatus: order.status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update status.");
      }

      setOrder(data.order);
      setSelectedStatus("");
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const allowed = order ? (TRANSITIONS[order.status] || []) : [];


  return (
    <div className="admin-dashboard admin-orders-page">
      <header className="site-header admin-site-header">
  <nav className="navbar">
    <Link to="/admin-dashboard" className="nav-logo">
      BOOK<span>MARKS</span>
    </Link>

    <div className={`nav-links ${mobileOpen ? "open" : ""}`}>
      <NavLink
        to="/admin/books"
        onClick={() => setMobileOpen(false)}
      >
        Books
      </NavLink>

      <NavLink
        to="/admin/customers"
        onClick={() => setMobileOpen(false)}
      >
        Customers
      </NavLink>

      <NavLink
        to="/admin/restock"
        onClick={() => setMobileOpen(false)}
      >
        Restock Books
      </NavLink>

      <NavLink
        to="/admin/orders"
        onClick={() => setMobileOpen(false)}
      >
        Orders
      </NavLink>
    </div>

    <form
      className="nav-search-form"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(
          `/admin/books?search=${encodeURIComponent(navQuery)}`
        );
      }}
    >
      <input
        className="nav-search-input"
        placeholder="Search books..."
        value={navQuery}
        onChange={(e) => setNavQuery(e.target.value)}
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
      aria-label="Toggle navigation"
      aria-expanded={mobileOpen}
      onClick={() => setMobileOpen(!mobileOpen)}
    >
      {mobileOpen ? <X size={26} /> : <Menu size={26} />}
    </button>
  </nav>
</header>
      <main className="admin-main">
        {loading ? (
          <p>Loading order details...</p>
        ) : !order ? (
          <div>
            <Link to="/admin/orders" className="admin-orders-back"><ArrowLeft size={18} /> Back to Orders</Link>
            <p className="admin-orders-error" role="alert">{error || "Order not found."}</p>
          </div>
        ) : (
          <>
        <div className="admin-page-heading">
          <p>BOOKMARKS ADMINISTRATION</p>
          <h1>Order #{order.order_id}</h1>
          <span>Order information and status management.</span>
        </div>

        <Link to="/admin/orders" className="admin-orders-back">
          <ArrowLeft size={18} /> Back to Orders
        </Link>

        <div className="admin-order-detail-header">
          <div>
            <h2>Order #{order.order_id}</h2>
            <p>
              <CalendarDays size={16} />
              {formatDate(order.placed_at)}
            </p>
          </div>
          <span className={`admin-order-badge ${order.status}`}>
            {titleCase(order.status)}
          </span>
        </div>

        <div className="admin-order-details-grid">
          <section className="admin-order-card">
            <h3><UserRound size={19} /> Customer Information</h3>
            <dl>
              <dt>Recipient</dt>
              <dd>{order.recipient_name}</dd>
              <dt>Account Type</dt>
              <dd>{order.account_id ? "Registered" : "Guest"}</dd>
              <dt>Email</dt>
              <dd>{order.guest_email || order.account_email || "—"}</dd>
              <dt>Phone</dt>
              <dd>{order.delivery_phone || "—"}</dd>
              {order.account_id && (
                <>
                  <dt>Customer Account</dt>
                  <dd>
                    <Link to={`/admin/customers/${order.account_id}`}>
                      View Customer #{order.account_id}
                    </Link>
                  </dd>
                </>
              )}
            </dl>
          </section>

          <section className="admin-order-card">
            <h3><MapPin size={19} /> Delivery Information</h3>
            <dl>
              <dt>Delivery Method</dt>
              <dd>{titleCase(order.delivery_method)}</dd>
              <dt>Delivery Address</dt>
              <dd>{order.delivery_address || "—"}</dd>
              <dt>Delivery Fee</dt>
              <dd>{money(order.delivery_fee)}</dd>
            </dl>
          </section>

          <section className="admin-order-card">
            <h3><CreditCard size={19} /> Payment Information</h3>
            <dl>
              <dt>Payment Method</dt>
              <dd>
                {order.payment_method === "cod"
                  ? "Cash on Delivery"
                  : titleCase(order.payment_method)}
              </dd>
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
              <dt>Delivery Fee</dt>
              <dd>{money(order.delivery_fee)}</dd>
              <dt>Total</dt>
              <dd><strong>{money(order.total)}</strong></dd>
            </dl>
          </section>

          <section className="admin-order-card">
            <h3><Truck size={19} /> Update Order Status</h3>

            <p className="admin-order-current">
              Current Status:
              <span className={`admin-order-badge ${order.status}`}>
                {titleCase(order.status)}
              </span>
            </p>

            {allowed.length > 0 ? (
              <>
                <label
                  className="admin-order-status-label"
                  htmlFor="next-order-status"
                >
                  Change Status To
                </label>

                <select
                  id="next-order-status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={saving}
                  className="admin-order-status-select"
                >
                  <option value="">Select next status</option>
                  {allowed.map((status) => (
                    <option value={status} key={status}>
                      {titleCase(status)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="admin-order-save-button"
                  disabled={!selectedStatus || saving}
                  onClick={updateStatus}
                >
                  {saving ? "Updating..." : "Update Status"}
                </button>
              </>
            ) : (
              <p className="admin-order-final-message">
                This order has reached a final status. No further
                status changes are permitted.
              </p>
            )}

            {error && (
              <p className="admin-orders-error" role="alert">{error}</p>
            )}
            {success && (
              <p className="admin-orders-success" role="status">{success}</p>
            )}
          </section>
        </div>

        <section className="admin-section">
          <div className="admin-section-heading">
            <h2><Package size={21} /> Ordered Books</h2>
            <span>{order.items?.length || 0} book line(s)</span>
          </div>

          <div className="admin-orders-panel">
            <div className="admin-orders-table-scroll">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item) => (
                    <tr key={item.order_item_id}>
                      <td>
                        <strong>{item.book_title}</strong>
                        <small>Book ID: {item.book_id}</small>
                      </td>
                      <td>{money(item.unit_price)}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-order-totals">
              <div><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div>
              <div><span>Delivery Fee</span><strong>{money(order.delivery_fee)}</strong></div>
              <div className="grand-total">
                <span>Grand Total</span>
                <strong>{money(order.total)}</strong>
              </div>
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
