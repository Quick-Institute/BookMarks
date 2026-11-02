
import { useEffect, useMemo, useState } from "react";
import {
  Link, NavLink, useNavigate, useSearchParams,
} from "react-router-dom";
import {
  Search, UserRound, Menu, X, ChevronDown,
  Eye, Pencil, Trash2,
} from "lucide-react";
import Footer from "./Footer";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
const PAGE_SIZE = 10;

const currency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function AdminBooks() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(params.get("search") || "");
  const [navQuery, setNavQuery] = useState("");
  const [sort, setSort] = useState("title");
  const [direction, setDirection] = useState("asc");
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setQuery(params.get("search") || "");
    setPage(1);
  }, [params]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBooks() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/admin/books`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load books."
          );
        }

        setBooks(Array.isArray(data.books) ? data.books : []);
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

    loadBooks();
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    const result = books.filter((book) =>
      [
        book.title,
        book.author,
        book.isbn,
        book.genre,
        book.id,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );

    result.sort((a, b) => {
      const aValue = a[sort] ?? "";
      const bValue = b[sort] ?? "";

      const comparison = [
        "price", "stock_quantity", "id",
      ].includes(sort)
        ? Number(aValue) - Number(bValue)
        : String(aValue).localeCompare(String(bValue), undefined, {
            sensitivity: "base",
            numeric: true,
          });

      return direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [books, query, sort, direction]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function changeSort(field) {
    if (sort === field) {
      setDirection((old) =>
        old === "asc" ? "desc" : "asc"
      );
    } else {
      setSort(field);
      setDirection("asc");
    }
    setPage(1);
  }

  function setSearch(value) {
    setQuery(value);
    setPage(1);
    setParams(
      value.trim() ? { search: value } : {},
      { replace: true }
    );
  }

  const navigateToBook = (book) =>
    navigate(`/admin/books/${book.id}`);

  return (
    <div className="admin-dashboard admin-books-page">
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
              setSearch(navQuery);
              setMobileOpen(false);
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
          <h1>Manage Books</h1>
          <span>Browse and manage your bookstore catalog.</span>
        </div>

        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>Books Catalog</h2>
            <span>
              {filtered.length} book{filtered.length !== 1 ? "s" : ""} found
            </span>
          </div>

          <div className="admin-books-panel">
            <div className="admin-books-toolbar">
              <label className="admin-books-search">
                <Search size={18} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, author, ISBN, genre..."
                  aria-label="Search books table"
                />
              </label>
              <span>Showing all books</span>
            </div>

            {loading ? (
              <p className="admin-books-message">Loading books...</p>
            ) : error ? (
              <p className="admin-books-message" role="alert">
                {error}
              </p>
            ) : (
              <>
                <div className="admin-books-table-scroll">
                  <table className="admin-books-table">
                    <thead>
                      <tr>
                        <th>Cover</th>
                        {[
                          ["title", "Book"],
                          ["author", "Author"],
                          ["isbn", "ISBN"],
                          ["genre", "Genre"],
                          ["price", "Price"],
                          ["stock_quantity", "Stock"],
                        ].map(([field, label]) => (
                          <th key={field}>
                            <button
                              type="button"
                              className="admin-books-sort"
                              onClick={() => changeSort(field)}
                            >
                              {label}{" "}
                              <span aria-hidden="true">
                                {sort === field
                                  ? direction === "asc" ? "↑" : "↓"
                                  : "↕"}
                              </span>
                            </button>
                          </th>
                        ))}
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visible.map((book) => {
                        const stock = Number(book.stock_quantity ?? 0);
                        const status = !book.is_active
                          ? "Inactive"
                          : stock === 0
                          ? "Out of Stock"
                          : stock <= 5
                          ? "Low Stock"
                          : "In Stock";

                        return (
                          <tr
                            key={book.id}
                            className="admin-books-clickable"
                            title={`View ${book.title}`}
                            onClick={() => navigateToBook(book)}
                          >
                            <td>
                              <img
                                className="admin-books-cover"
                                src={book.image || "/images/no-cover.jpg"}
                                alt={`${book.title} cover`}
                                loading="lazy"
                                onError={(event) => {
                                  if (!event.currentTarget.src.endsWith("/images/no-cover.jpg")) {
                                    event.currentTarget.src = "/images/no-cover.jpg";
                                  }
                                }}
                              />
                            </td>
                            <td>
                              <strong>{book.title}</strong>
                              <small>ID: {book.id}</small>
                            </td>
                            <td>{book.author}</td>
                            <td>{book.isbn || "—"}</td>
                            <td>{book.genre || "—"}</td>
                            <td className="admin-books-nowrap">
                              {currency(book.price)}
                            </td>
                            <td>{stock}</td>
                            <td>
                              <span
                                className={`admin-books-status ${
                                  !book.is_active || stock === 0
                                    ? "out"
                                    : stock <= 5 ? "low" : "in"
                                }`}
                              >
                                {status}
                              </span>
                            </td>

                            <td
                              className="admin-books-action-cell"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="admin-books-action-wrap">
                                <button
                                  type="button"
                                  className="admin-books-action-button"
                                  aria-expanded={openMenu === book.id}
                                  onClick={() =>
                                    setOpenMenu(
                                      openMenu === book.id ? null : book.id
                                    )
                                  }
                                >
                                  Actions <ChevronDown size={15} />
                                </button>

                                {openMenu === book.id && (
                                  <div className="admin-books-dropdown">
                                    <button
                                      type="button"
                                      onClick={() => navigateToBook(book)}
                                    >
                                      <Eye size={16} /> View Book
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate(`/admin/books/${book.id}?edit=1`)
                                      }
                                    >
                                      <Pencil size={16} /> Edit Book
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate(`/admin/books/${book.id}?delete=1`)
                                      }
                                      disabled={!book.is_active}
                                    >
                                      <Trash2 size={16} /> Delete Book
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filtered.length === 0 && (
                    <p className="admin-books-message">
                      No books match your search.
                    </p>
                  )}
                </div>

                <div className="admin-books-pagination">
                  <span>
                    {filtered.length === 0
                      ? 0
                      : (currentPage - 1) * PAGE_SIZE + 1}
                    –{Math.min(currentPage * PAGE_SIZE, filtered.length)}
                    {" "}of {filtered.length}
                  </span>

                  <div>
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setPage(currentPage - 1);
                        setOpenMenu(null);
                      }}
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setPage(currentPage + 1);
                        setOpenMenu(null);
                      }}
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
