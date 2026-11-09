
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Search,
  UserRound,
  Menu,
  X,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import Footer from "./Footer";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const emptyForm = {
  name: "",
  biography: "",
  image_url: "",
};

const getPhotoUrl = (url) => {
  if (!url) {
    return "/images/authors/default-author.png";
  }

  if (url.startsWith("/uploads/")) {
    return `${API_URL}${url}`;
  }

  return url;
};

export default function AdminAuthors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [bookSearch, setBookSearch] = useState("");

  const navigate = useNavigate();

  // Load all authors from the backend
  const loadAuthors = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/authors`,
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load authors."
        );
      }

      setAuthors(data.authors || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthors();
  }, []);

  // Open the Add Author or Edit Author form
  const openEditor = (author = null) => {
    setEditing(author ? author.author_id : "new");

    setForm(
      author
        ? {
            name: author.name || "",
            biography: author.biography || "",
            image_url: author.image_url || "",
          }
        : { ...emptyForm }
    );

    setFile(null);
    setNotice("");
    setError("");
  };

  // Save author details and optional photograph
  const saveAuthor = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const creating = editing === "new";

      const endpoint = creating
        ? `${API_URL}/api/admin/authors`
        : `${API_URL}/api/admin/authors/${editing}`;

      const response = await fetch(endpoint, {
        method: creating ? "POST" : "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save author."
        );
      }

      // Upload photo after author has been saved
      if (file) {
        const formData = new FormData();
        formData.append("photo", file);

        const uploadResponse = await fetch(
          `${API_URL}/api/admin/authors/${data.author.author_id}/photo`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(
            `Author saved, but photo upload failed: ${
              uploadData.message || "Unknown error"
            }`
          );
        }
      }

      setEditing(null);
      setFile(null);

      setNotice(
        creating
          ? "Author added successfully."
          : "Author updated successfully."
      );

      await loadAuthors();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete an author who has no linked books
  const deleteAuthor = async (author) => {
    if (
      !window.confirm(
        `Delete ${author.name}? This cannot be undone.`
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/authors/${author.author_id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not delete author."
        );
      }

      setNotice("Author deleted.");
      await loadAuthors();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredAuthors = authors.filter((author) =>
    author.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleBookSearch = (event) => {
    event.preventDefault();

    if (bookSearch.trim()) {
      navigate(
        `/admin/books?search=${encodeURIComponent(
          bookSearch.trim()
        )}`
      );
    }
  };

  return (
    <div className="admin-dashboard admin-authors-page">
      {/* ADMIN NAVBAR */}
      <header className="site-header admin-site-header">
        <nav className="navbar">
          <Link
            to="/admin-dashboard"
            className="nav-logo"
          >
            BOOK<span>MARKS</span>
          </Link>

          <div
            className={`nav-links ${
              menuOpen ? "open" : ""
            }`}
          >
            <NavLink
              to="/admin/books"
              onClick={() => setMenuOpen(false)}
            >
              Books
            </NavLink>

            <NavLink
              to="/admin/customers"
              onClick={() => setMenuOpen(false)}
            >
              Customers
            </NavLink>

            <NavLink
              to="/admin/restock"
              onClick={() => setMenuOpen(false)}
            >
              Restock Books
            </NavLink>

            <NavLink
              to="/admin/orders"
              onClick={() => setMenuOpen(false)}
            >
              Orders
            </NavLink>
          </div>

          <form
            className="nav-search-form"
            onSubmit={handleBookSearch}
          >
            <input
              className="nav-search-input"
              placeholder="Search books..."
              value={bookSearch}
              onChange={(event) =>
                setBookSearch(event.target.value)
              }
            />

            <button
              className="nav-search-btn"
              type="submit"
              aria-label="Search books"
            >
              <Search size={24} />
            </button>
          </form>

          <div className="nav-icons">
            <Link
              to="/admin/profile"
              className="profile-link"
            >
              <UserRound size={29} />
              <span>My Profile</span>
            </Link>
          </div>

          <button
            type="button"
            className="hamburger"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <div className="admin-page-heading">
          <p>BOOKMARKS ADMINISTRATION</p>
          <h1>Manage Authors</h1>
          <span>
            Add, edit and organize author profiles.
          </span>
        </div>

        <section className="ma-panel">
          {/* SEARCH AND ADD AUTHOR */}
          <div className="ma-toolbar">
            <label className="ma-search">
              <Search size={18} />

              <input
                type="search"
                placeholder="Search authors..."
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
              />
            </label>

            <button
              type="button"
              className="ma-primary"
              onClick={() => openEditor()}
            >
              <Plus size={18} />
              Add Author
            </button>
          </div>

          {/* FEEDBACK */}
          {error && (
            <p className="ma-error" role="alert">
              {error}
            </p>
          )}

          {notice && (
            <p className="ma-success" role="status">
              {notice}
            </p>
          )}

          {/* AUTHORS LIST */}
          {loading ? (
            <p>Loading authors...</p>
          ) : filteredAuthors.length === 0 ? (
            <p>No authors found.</p>
          ) : (
            <div className="ma-list">
              {filteredAuthors.map((author) => (
                <div
                  className="ma-item"
                  key={author.author_id}
                >
                  <img
                    src={getPhotoUrl(author.image_url)}
                    alt={author.name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "/images/authors/default-author.png";
                    }}
                  />

                  <div className="ma-info">
                    <strong>{author.name}</strong>

                    <span>
                      {author.book_count} book(s)
                    </span>
                  </div>

                  <div className="ma-actions">
                    <button
                      type="button"
                      onClick={() =>
                        openEditor(author)
                      }
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteAuthor(author)
                      }
                      disabled={
                        Number(author.book_count) > 0
                      }
                      title={
                        Number(author.book_count) > 0
                          ? "Reassign books before deleting"
                          : "Delete author"
                      }
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ADD / EDIT AUTHOR MODAL */}
        {editing !== null && (
          <div
            className="ma-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !saving
              ) {
                setEditing(null);
              }
            }}
          >
            <section
              className="ma-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={
                editing === "new"
                  ? "Add author"
                  : "Edit author"
              }
            >
              <div className="ma-dialog-head">
                <h2>
                  {editing === "new"
                    ? "Add Author"
                    : "Edit Author"}
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setEditing(null)
                  }
                  disabled={saving}
                  aria-label="Close"
                >
                  <X />
                </button>
              </div>

              <form onSubmit={saveAuthor}>
                <label>
                  Author name

                  <input
                    required
                    maxLength={200}
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Biography

                  <textarea
                    rows={7}
                    maxLength={20000}
                    value={form.biography}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        biography: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Photo URL (optional)

                  <input
                    value={form.image_url}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        image_url: event.target.value,
                      })
                    }
                    placeholder="/images/authors/photo.jpg"
                  />
                </label>

                <label>
                  Or upload a photo (JPG, PNG, WebP;
                  max 5 MB)

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      setFile(
                        event.target.files?.[0] || null
                      )
                    }
                  />
                </label>

                <div className="ma-dialog-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setEditing(null)
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="ma-primary"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Author"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
