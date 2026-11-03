import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Search, ShoppingBag, Clock, CheckCircle2,
  Truck, XCircle, Eye, ArrowUpDown, Menu,
  X,
  UserRound,
} from "lucide-react";
import Footer from "./Footer";




const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PAGE_SIZE = 10;

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      try {
        const response = await fetch(
          `${API}/api/admin/orders`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load orders.");
        }

        setOrders(data.orders || []);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadOrders();
    return () => controller.abort();
  }, []);

  const stats = useMemo(() => ({
  total: orders.length,
  placed: orders.filter((o) => o.status === "placed").length,
  confirmed: orders.filter((o) => o.status === "confirmed").length,
  dispatched: orders.filter((o) => o.status === "dispatched").length,
  delivered: orders.filter((o) => o.status === "delivered").length,
  cancelled: orders.filter((o) => o.status === "cancelled").length,
    }), [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const matchesSearch = [
        order.order_id,
        order.recipient_name,
        order.guest_email,
        order.account_email,
        order.delivery_phone,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(q)
      );

      return matchesStatus && matchesSearch;
    });

    result.sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.placed_at) - new Date(b.placed_at);
      }
      if (sort === "highest") {
        return Number(b.total) - Number(a.total);
      }
      if (sort === "lowest") {
        return Number(a.total) - Number(b.total);
      }
      return new Date(b.placed_at) - new Date(a.placed_at);
    });

    return result;
  }, [orders, search, statusFilter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);

  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const cards = [
    { label: "Total Orders", value: stats.total, Icon: ShoppingBag },
    { label: "Placed", value: stats.placed, Icon: Clock },
    { label: "Confirmed", value: stats.confirmed, Icon: CheckCircle2 },
    { label: "Dispatched", value: stats.dispatched, Icon: Truck },
    { label: "Delivered", value: stats.delivered, Icon: CheckCircle2 },
    { label: "Cancelled", value: stats.cancelled, Icon: XCircle },
    ];

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
        <div className="admin-page-heading">
          <p>BOOKMARKS ADMINISTRATION</p>
          <h1>Manage Orders</h1>
          <span>View and manage registered customer and guest orders.</span>
        </div>

        <div className="admin-orders-stats">
          {cards.map(({ label, value, Icon }) => (
            <div className="admin-orders-stat" key={label}>
              <Icon size={24} />
              <strong>{loading ? "—" : value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>All Orders</h2>
            <span>{filtered.length} order(s) found</span>
          </div>

          <div className="admin-orders-panel">
            <div className="admin-orders-toolbar">
              <label className="admin-orders-search">
                <Search size={19} />
                <input
                  type="search"
                  value={search}
                  placeholder="Search order ID, customer, email, phone..."
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </label>

              <select
                value={statusFilter}
                aria-label="Filter by order status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="placed">Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <label className="admin-orders-sort">
                <ArrowUpDown size={17} />
                <select
                  value={sort}
                  aria-label="Sort orders"
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Total</option>
                  <option value="lowest">Lowest Total</option>
                </select>
              </label>
            </div>

            {error && (
              <p className="admin-orders-error" role="alert">{error}</p>
            )}

            {loading ? (
              <p className="admin-orders-empty">Loading orders...</p>
            ) : (
              <>
                <div className="admin-orders-table-scroll">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((order) => (
                        <tr
                          key={order.order_id}
                          onClick={() =>
                            navigate(`/admin/orders/${order.order_id}`)
                          }
                        >
                          <td>
                            <strong>#{order.order_id}</strong>
                          </td>
                          <td>
                            <strong>{order.recipient_name}</strong>
                            <small>
                              {order.account_id
                                ? "Registered Customer"
                                : "Guest Customer"}
                            </small>
                          </td>
                          <td>{formatDate(order.placed_at)}</td>
                          <td>{order.item_count}</td>
                          <td className="admin-orders-nowrap">
                            {money(order.total)}
                          </td>
                          <td>
                            <span className={`admin-order-badge ${order.status}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <Link
                              to={`/admin/orders/${order.order_id}`}
                              className="admin-orders-view"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye size={16} /> View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filtered.length === 0 && (
                    <p className="admin-orders-empty">
                      No orders match your search or filter.
                    </p>
                  )}
                </div>

                <div className="admin-orders-pagination">
                  <span>
                    {filtered.length === 0
                      ? 0
                      : (currentPage - 1) * PAGE_SIZE + 1}
                    {" – "}
                    {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                    {" of "}
                    {filtered.length}
                  </span>

                  <div>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      Previous
                    </button>
                    <span>Page {currentPage} of {pages}</span>
                    <button
                      disabled={currentPage === pages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
