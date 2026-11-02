import { useEffect, useMemo, useState } from "react";
import {
  Link, NavLink, useNavigate, useSearchParams,
} from "react-router-dom";
import {
  Search, UserRound, Menu, X, ChevronDown,
  Eye, UserCheck, UserX, Users,
} from "lucide-react";
import Footer from "./Footer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PAGE_SIZE = 10;

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const date = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState(params.get("search") || "");
  const [navQuery, setNavQuery] = useState("");
  const [sort, setSort] = useState("created_at");
  const [direction, setDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuery(params.get("search") || "");
    setPage(1);
  }, [params]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/api/admin/customers`,
          { credentials: "include", signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Could not load customers.");
        }
        setCustomers(data.customers || []);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    function closeMenu(event) {
      if (!event.target.closest(".admin-customers-action-wrap")) {
        setMenu(null);
      }
    }
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);

  const counts = useMemo(() => ({
    total: customers.length,
    active: customers.filter((c) => c.is_active).length,
    inactive: customers.filter((c) => !c.is_active).length,
  }), [customers]);

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    const rows = customers.filter((c) =>
      [c.account_id, c.full_name, c.email, c.phone]
        .some((v) => String(v ?? "").toLowerCase().includes(term))
    );

    rows.sort((a, b) => {
      let comparison;
      if (["account_id", "order_count", "total_spent"].includes(sort)) {
        comparison = Number(a[sort]) - Number(b[sort]);
      } else if (sort === "created_at") {
        comparison = new Date(a.created_at) - new Date(b.created_at);
      } else if (sort === "is_active") {
        comparison = Number(a.is_active) - Number(b.is_active);
      } else {
        comparison = String(a[sort] ?? "").localeCompare(
          String(b[sort] ?? ""), undefined,
          { sensitivity: "base" }
        );
      }
      return direction === "asc" ? comparison : -comparison;
    });

    return rows;
  }, [customers, query, sort, direction]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE
  );

  function changeSort(field) {
    if (sort === field) {
      setDirection((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setDirection("asc");
    }
    setPage(1);
  }

  function search(value) {
    setQuery(value);
    setPage(1);
    setParams(value.trim() ? { search: value } : {}, { replace: true });
  }

  async function changeStatus(customer) {
    const next = !customer.is_active;
    const action = next ? "activate" : "deactivate";

    if (!window.confirm(
      `Are you sure you want to ${action} ${customer.full_name}?`
    )) return;

    setBusyId(customer.account_id);
    setError("");
    setMenu(null);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/customers/${customer.account_id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: next }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update customer.");
      }

      setCustomers((old) => old.map((c) =>
        c.account_id === customer.account_id ? data.customer : c
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-dashboard admin-customers-page">
      <header className="site-header admin-site-header">
        <nav className="navbar">
          <Link to="/admin-dashboard" className="nav-logo">
            BOOK<span>MARKS</span>
          </Link>

          <div className={`nav-links ${mobileOpen ? "open" : ""}`}>
            <NavLink to="/admin/books" onClick={() => setMobileOpen(false)}>Books</NavLink>
            <NavLink to="/admin/customers" onClick={() => setMobileOpen(false)}>Customers</NavLink>
            <NavLink to="/admin/restock" onClick={() => setMobileOpen(false)}>Restock Books</NavLink>
            <NavLink to="/admin/orders" onClick={() => setMobileOpen(false)}>Orders</NavLink>
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
              <UserRound size={29} /><span>My Profile</span>
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
          <h1>Manage Customers</h1>
          <span>View registered customers and their account activity.</span>
        </div>

        <div className="admin-customer-stats">
          {[
            { label: "Total Customers", value: counts.total, Icon: Users },
            { label: "Active Customers", value: counts.active, Icon: UserCheck },
            { label: "Inactive Customers", value: counts.inactive, Icon: UserX },
          ].map(({ label, value, Icon }) => (
            <div className="admin-customer-stat" key={label}>
              <Icon size={23} />
              <strong>{loading ? "—" : value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>Customer Accounts</h2>
            <span>{filtered.length} customer(s) found</span>
          </div>

          <div className="admin-books-panel">
            <div className="admin-books-toolbar">
              <label className="admin-books-search">
                <Search size={18} />
                <input
                  type="search"
                  value={query}
                  placeholder="Search by name, email, phone or ID..."
                  onChange={(e) => search(e.target.value)}
                />
              </label>
              <span>Registered customers only</span>
            </div>

            {error && <p className="admin-books-message" role="alert">{error}</p>}

            {loading ? (
              <p className="admin-books-message">Loading customers...</p>
            ) : (
              <>
                <div className="admin-books-table-scroll">
                  <table className="admin-books-table">
                    <thead>
                      <tr>
                        {[
                          ["full_name", "Customer"],
                          ["email", "Email"],
                          ["phone", "Phone"],
                          ["order_count", "Orders"],
                          ["total_spent", "Total Spent"],
                          ["created_at", "Joined"],
                          ["is_active", "Status"],
                        ].map(([field, label]) => (
                          <th key={field}>
                            <button
                              className="admin-books-sort"
                              type="button"
                              onClick={() => changeSort(field)}
                            >
                              {label}{" "}
                              <span>{sort === field
                                ? direction === "asc" ? "↑" : "↓"
                                : "↕"}</span>
                            </button>
                          </th>
                        ))}
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visible.map((customer) => (
                        <tr
                          key={customer.account_id}
                          className="admin-books-clickable"
                          onClick={() => navigate(
                            `/admin/customers/${customer.account_id}`
                          )}
                        >
                          <td>
                            <strong>{customer.full_name}</strong>
                            <small>ID: {customer.account_id}</small>
                          </td>
                          <td>{customer.email}</td>
                          <td>{customer.phone || "—"}</td>
                          <td>{customer.order_count}</td>
                          <td className="admin-books-nowrap">
                            {money(customer.total_spent)}
                          </td>
                          <td>{date(customer.created_at)}</td>
                          <td>
                            <span className={`admin-customer-status ${
                              customer.is_active ? "active" : "inactive"
                            }`}>
                              {customer.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="admin-books-action-cell"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="admin-customers-action-wrap admin-books-action-wrap">
                              <button
                                type="button"
                                className="admin-books-action-button"
                                disabled={busyId === customer.account_id}
                                onClick={() => setMenu(
                                  menu === customer.account_id
                                    ? null : customer.account_id
                                )}
                              >
                                Actions <ChevronDown size={15} />
                              </button>

                              {menu === customer.account_id && (
                                <div className="admin-books-dropdown">
                                  <button type="button" onClick={() =>
                                    navigate(`/admin/customers/${customer.account_id}`)
                                  }>
                                    <Eye size={16} /> View Customer
                                  </button>
                                  <button type="button" onClick={() =>
                                    changeStatus(customer)
                                  }>
                                    {customer.is_active
                                      ? <UserX size={16} />
                                      : <UserCheck size={16} />}
                                    {customer.is_active
                                      ? "Deactivate" : "Activate"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filtered.length === 0 && (
                    <p className="admin-books-message">
                      No customers match your search.
                    </p>
                  )}
                </div>

                <div className="admin-books-pagination">
                  <span>
                    {filtered.length === 0
                      ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                    –{Math.min(currentPage * PAGE_SIZE, filtered.length)}
                    {" "}of {filtered.length}
                  </span>
                  <div>
                    <button type="button" disabled={currentPage === 1}
                      onClick={() => { setPage(currentPage - 1); setMenu(null); }}>
                      Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button type="button" disabled={currentPage === totalPages}
                      onClick={() => { setPage(currentPage + 1); setMenu(null); }}>
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
