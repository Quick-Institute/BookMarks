import AdminNavbar from "./AdminNavbar.jsx";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  ShieldCheck,
  LayoutDashboard,
  BookOpen,
  Users,
  Package,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminProfile() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [account, setAccount] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccount() {
      try {
        const response = await fetch(
          `${API_URL}/api/account/me`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          navigate("/account", { replace: true });
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load account."
          );
        }

        if (data.account?.role !== "admin") {
          navigate("/my-profile", { replace: true });
          return;
        }

        setAccount(data.account);
        setForm({
          full_name: data.account.full_name || "",
          email: data.account.email || "",
          phone: data.account.phone || "",
        });
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

    loadAccount();

    return () => controller.abort();
  }, [navigate]);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/account/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update profile."
        );
      }

      setAccount(data.account);
      setForm({
        full_name: data.account.full_name || "",
        email: data.account.email || "",
        phone: data.account.phone || "",
      });

      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      full_name: account.full_name || "",
      email: account.email || "",
      phone: account.phone || "",
    });

    setEditing(false);
    setError("");
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to log out.");
      }

      setUser(null);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
      setLoggingOut(false);
    }
  };

  const shortcuts = [
    {
      title: "Dashboard",
      description: "Sales overview and analytics",
      path: "/admin-dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Manage Books",
      description: "View and manage the catalog",
      path: "/admin/books",
      icon: BookOpen,
    },
    {
      title: "Customers",
      description: "Customer management",
      path: "/admin/customers",
      icon: Users,
    },
    {
      title: "Restock Books",
      description: "Inventory and stock management",
      path: "/admin/restock",
      icon: Package,
    },
    {
      title: "Orders",
      description: "Order management",
      path: "/admin/orders",
      icon: ClipboardList,
    },
  ];

  const displayDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div className="admin-dashboard admin-profile-page">
      <AdminNavbar />

      <main className="admin-main">
        <div className="admin-page-heading">
          <p>BOOKMARKS ADMINISTRATION</p>
          <h1>Administrator Profile</h1>
          <span>
            Manage your account and access bookstore
            administration.
          </span>
        </div>

        {loading ? (
          <div className="admin-account-card">
            Loading administrator profile...
          </div>
        ) : !account ? (
          <div className="admin-account-card" role="alert">
            {error || "Administrator account unavailable."}
          </div>
        ) : (
          <>
            <section className="admin-account-hero">
              <div className="admin-account-avatar">
                <UserRound size={36} />
              </div>

              <div className="admin-account-identity">
                <span className="admin-account-label">
                  ADMINISTRATOR ACCOUNT
                </span>
                <h2>{account.full_name}</h2>
                <p>{account.email}</p>
              </div>

              <span className="admin-account-status">
                {account.is_active ? "Active" : "Inactive"}
              </span>
            </section>

            {error && (
              <p className="admin-account-error" role="alert">
                {error}
              </p>
            )}

            {message && (
              <p className="admin-account-success" role="status">
                {message}
              </p>
            )}

            <div className="admin-account-grid">
              <section className="admin-account-card">
                <div className="admin-account-card-heading">
                  <div>
                    <h3>Account Details</h3>
                    <p>Your personal account information</p>
                  </div>

                  {!editing && (
                    <button
                      type="button"
                      className="admin-account-button"
                      onClick={() => {
                        setEditing(true);
                        setMessage("");
                      }}
                    >
                      Edit Details
                    </button>
                  )}
                </div>

                {!editing ? (
                  <div className="admin-account-details">
                    <div>
                      <span>Full Name</span>
                      <strong>{account.full_name}</strong>
                    </div>

                    <div>
                      <span>Email Address</span>
                      <strong>{account.email}</strong>
                    </div>

                    <div>
                      <span>Phone Number</span>
                      <strong>
                        {account.phone || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Joined</span>
                      <strong>
                        {displayDate(account.created_at)}
                      </strong>
                    </div>

                    <div>
                      <span>Last Updated</span>
                      <strong>
                        {displayDate(account.updated_at)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <form
                    className="admin-account-form"
                    onSubmit={handleSave}
                  >
                    <label htmlFor="admin-full-name">
                      Full Name
                    </label>
                    <input
                      id="admin-full-name"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      maxLength={150}
                      required
                    />

                    <label htmlFor="admin-email">
                      Email Address
                    </label>
                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      maxLength={255}
                      required
                    />

                    <label htmlFor="admin-phone">
                      Phone Number
                    </label>
                    <input
                      id="admin-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={20}
                    />

                    <div className="admin-account-actions">
                      <button
                        type="submit"
                        className="admin-account-button"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        className="admin-account-secondary"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </section>

              <section className="admin-account-card">
                <div className="admin-account-card-heading">
                  <div>
                    <h3>
                      <ShieldCheck size={20} />
                      Access & Security
                    </h3>
                    <p>Administrator account permissions</p>
                  </div>
                </div>

                <div className="admin-account-details">
                  <div>
                    <span>Account Role</span>
                    <strong>Administrator</strong>
                  </div>

                  <div>
                    <span>Account Status</span>
                    <strong>
                      {account.is_active ? "Active" : "Inactive"}
                    </strong>
                  </div>

                  <div>
                    <span>Account ID</span>
                    <strong>{account.account_id}</strong>
                  </div>
                </div>

                <div className="admin-account-security-note">
                  Administrator access is controlled by
                  your account role.
                </div>

                <button
                  type="button"
                  className="admin-account-logout"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut size={17} />
                  {loggingOut ? "Logging Out..." : "Logout"}
                </button>
              </section>
            </div>

            <section className="admin-account-shortcuts">
              <div className="admin-section-heading">
                <h2>Administration</h2>
                <span>Quick access to management pages</span>
              </div>

              <div className="admin-account-shortcut-grid">
                {shortcuts.map((shortcut) => {
                  const Icon = shortcut.icon;

                  return (
                    <Link
                      key={shortcut.path}
                      to={shortcut.path}
                      className="admin-account-shortcut"
                    >
                      <Icon size={24} />
                      <strong>{shortcut.title}</strong>
                      <span>{shortcut.description}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="admin-footer">
        © {new Date().getFullYear()} BookMarks.
        Admin Dashboard.
      </footer>
    </div>
  );
}
