
import { useEffect, useState } from "react";
import {
  Link, NavLink, useNavigate, useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Search, UserRound, Menu, X, ArrowLeft,
  Save, Trash2, Pencil,
} from "lucide-react";
import Footer from "./Footer";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminBookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [book, setBook] = useState(null);
  const [original, setOriginal] = useState(null);
  const [options, setOptions] = useState({
    authors: [],
    genres: [],
  });
  const [editing, setEditing] = useState(
    params.get("edit") === "1"
  );
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

        const config = {
          credentials: "include",
          signal: controller.signal,
        };

        const [bookResponse, optionsResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/admin/books/${id}`, config),
            fetch(`${API_URL}/api/admin/books/options`, config),
          ]);

        if (!bookResponse.ok || !optionsResponse.ok) {
          const failed = !bookResponse.ok
            ? bookResponse
            : optionsResponse;
          const data = await failed.json().catch(() => ({}));
          throw new Error(
            data.message || "Unable to load book details."
          );
        }

        const bookData = await bookResponse.json();
        const optionsData = await optionsResponse.json();

        setBook(bookData.book);
        setOriginal(bookData.book);
        setOptions(optionsData);
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

    load();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    setEditing(params.get("edit") === "1");
  }, [params]);

  function change(field, value) {
    setBook((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/books/${id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(book),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save book.");
      }

      setBook(data.book);
      setOriginal(data.book);
      setEditing(false);
      setMessage("Book changes saved successfully.");
      navigate(`/admin/books/${id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!book?.is_active || saving) return;

    const confirmed = window.confirm(
      `Remove "${book.title}" from sale?\n\n` +
      "This makes the book inactive. " +
      "Existing orders and ratings remain preserved."
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/books/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove book.");
      }

      navigate("/admin/books");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  function cancelEdit() {
    setBook({ ...original });
    setEditing(false);
    setError("");
    navigate(`/admin/books/${id}`, { replace: true });
  }

  function field(label, key, type = "text") {
    return (
      <label className="admin-book-field">
        <span>{label}</span>
        <input
          type={type}
          value={book?.[key] ?? ""}
          disabled={!editing || saving}
          onChange={(event) => change(key, event.target.value)}
          min={type === "number" ? "0" : undefined}
          step={key === "price" ? "0.01" : undefined}
          required={["title", "price", "stock_quantity"].includes(key)}
        />
      </label>
    );
  }

  return (
    <div className="admin-dashboard admin-book-details-page">
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

          <form
            className="nav-search-form"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(
                `/admin/books?search=${encodeURIComponent(navQuery)}`
              );
            }}
          >
            <input
              className="nav-search-input"
              placeholder="Search books..."
              value={navQuery}
              onChange={(event) => setNavQuery(event.target.value)}
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
          <h1>Book Details</h1>
          <span>View and manage catalog information.</span>
        </div>

        <Link className="admin-book-back" to="/admin/books">
          <ArrowLeft size={18} /> Back to Books
        </Link>

        {loading && <p>Loading book...</p>}

        {!loading && !book && error && (
          <p role="alert">{error}</p>
        )}

        {!loading && book && (
          <section className="admin-section">
            <div className="admin-section-heading">
              <h2>{book.title}</h2>
              <span>
                Book ID: {book.id} ·{" "}
                {book.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <form className="admin-book-editor" onSubmit={save}>
              <div className="admin-book-cover-panel">
                <img
                  src={book.image || "/images/no-cover.jpg"}
                  alt={`${book.title} cover`}
                  onError={(event) => {
                    if (!event.currentTarget.src.endsWith("/images/no-cover.jpg")) {
                      event.currentTarget.src = "/images/no-cover.jpg";
                    }
                  }}
                />
                {field("Cover image URL", "image")}
              </div>

              <div className="admin-book-fields">
                {field("Book title", "title")}
                {field("ISBN", "isbn")}

                <label className="admin-book-field">
                  <span>Author</span>
                  <select
                    value={book.author_id ?? ""}
                    disabled={!editing || saving}
                    onChange={(event) =>
                      change("author_id", event.target.value)
                    }
                    required
                  >
                    <option value="" disabled>Select author</option>
                    {options.authors.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-book-field">
                  <span>Genre</span>
                  <select
                    value={book.genre_id ?? ""}
                    disabled={!editing || saving}
                    onChange={(event) =>
                      change("genre_id", event.target.value)
                    }
                    required
                  >
                    <option value="" disabled>Select genre</option>
                    {options.genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </label>

                {field("Price (Rs.)", "price", "number")}
                {field("Stock quantity", "stock_quantity", "number")}

                <label className="admin-book-field">
                  <span>Availability</span>
                  <select
                    value={String(book.is_active)}
                    disabled={!editing || saving}
                    onChange={(event) =>
                      change(
                        "is_active",
                        event.target.value === "true"
                      )
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </label>

                <label className="admin-book-field admin-book-wide">
                  <span>Description</span>
                  <textarea
                    rows={6}
                    value={book.description || ""}
                    disabled={!editing || saving}
                    onChange={(event) =>
                      change("description", event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="admin-book-actions">
                {editing ? (
                  <>
                    <button
                      type="submit"
                      className="admin-book-primary"
                      disabled={saving}
                    >
                      <Save size={17} />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="admin-book-primary"
                    onClick={() => {
                      setEditing(true);
                      setMessage("");
                    }}
                  >
                    <Pencil size={17} /> Edit Book
                  </button>
                )}

                <button
                  type="button"
                  className="admin-book-delete"
                  disabled={saving || !book.is_active}
                  onClick={remove}
                >
                  <Trash2 size={17} /> Delete Book
                </button>
              </div>

              {error && (
                <p className="admin-book-error" role="alert">
                  {error}
                </p>
              )}

              {message && (
                <p className="admin-book-success" role="status">
                  {message}
                </p>
              )}

              {!book.is_active && (
                <p className="admin-book-wide">
                  This book is inactive and hidden from the customer catalog.
                </p>
              )}
            </form>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
