import { useEffect, useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  Menu,
  X,
  UserRound,
  Search
} from "lucide-react";
import Footer from "./Footer";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminRestockBooks() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");

  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadBooks() {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/books/restock`,
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load inventory."
        );
      }

      setBooks(data.books || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  function changeQuantity(id, value) {
    setQuantities((previous) => ({
      ...previous,
      [id]: value,
    }));
  }

  async function restock(book) {
    const quantity = Number(quantities[book.id]);

    if (
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      quantity > 100000
    ) {
      setError("Enter a valid quantity greater than zero.");
      return;
    }

    const confirmed = window.confirm(
      `Add ${quantity} copies of "${book.title}" to stock?`
    );

    if (!confirmed) return;

    try {
      setSavingId(book.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/books/${book.id}/restock`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to restock book."
        );
      }

      setMessage(
        `${book.title}: ${data.message} New stock: ${data.book.stock_quantity}`
      );

      setQuantities((previous) => ({
        ...previous,
        [book.id]: "",
      }));

      await loadBooks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  const filteredBooks = books.filter((book) => {
    const query = search.toLowerCase();

    return (
      book.title?.toLowerCase().includes(query) ||
      book.author?.toLowerCase().includes(query) ||
      book.isbn?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="admin-dashboard admin-restock-layout">
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
      <main className="admin-restock-page">
      <div className="admin-restock-heading">
        <div>
          <h1>Restock Books</h1>
          <p>
            Manage books that are running low or out of stock.
          </p>
        </div>

        <button
          className="admin-restock-secondary"
          onClick={() => navigate("/admin/books")}
        >
          View All Books
        </button>
      </div>

      <div className="admin-restock-stats">
        <div className="admin-restock-stat">
          <span>Books to Restock</span>
          <strong>{books.length}</strong>
        </div>

        <div className="admin-restock-stat">
          <span>Out of Stock</span>
          <strong>
            {books.filter(
              (book) => Number(book.stock_quantity) === 0
            ).length}
          </strong>
        </div>

        <div className="admin-restock-stat">
          <span>Low Stock</span>
          <strong>
            {books.filter(
              (book) => Number(book.stock_quantity) > 0
            ).length}
          </strong>
        </div>
      </div>

      <div className="admin-restock-panel">
        <div className="admin-restock-toolbar">
          <h2>Inventory Restock List</h2>

          <input
            type="search"
            placeholder="Search title, author or ISBN..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {error && (
          <p className="admin-restock-error">{error}</p>
        )}

        {message && (
          <p className="admin-restock-success">{message}</p>
        )}

        {loading ? (
          <p>Loading inventory...</p>
        ) : filteredBooks.length === 0 ? (
          <p className="admin-restock-empty">
            No books currently need restocking.
          </p>
        ) : (
          <div className="admin-restock-table-wrap">
            <table className="admin-restock-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>ISBN</th>
                  <th>Current Stock</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Add Quantity</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredBooks.map((book) => {
                  const stock = Number(
                    book.stock_quantity
                  );

                  return (
                    <tr key={book.id}>
                      <td>
                        <div className="admin-restock-book">
                          <img
                            src={
                              book.image ||
                              "/images/no-cover.jpg"
                            }
                            alt={book.title}
                            onError={(event) => {
                              event.currentTarget.src =
                                "/images/no-cover.jpg";
                            }}
                          />

                          <div>
                            <strong>{book.title}</strong>
                            <span>{book.author}</span>
                          </div>
                        </div>
                      </td>

                      <td>{book.isbn || "—"}</td>
                      <td>{stock}</td>
                      <td>
                        {book.restock_threshold ?? 5}
                      </td>

                      <td>
                        <span
                          className={
                            stock === 0
                              ? "admin-stock-badge out"
                              : "admin-stock-badge low"
                          }
                        >
                          {stock === 0
                            ? "Out of Stock"
                            : "Low Stock"}
                        </span>
                      </td>

                      <td>
                        <input
                          className="admin-restock-quantity"
                          type="number"
                          min="1"
                          max="100000"
                          step="1"
                          placeholder="Qty"
                          value={
                            quantities[book.id] ?? ""
                          }
                          onChange={(event) =>
                            changeQuantity(
                              book.id,
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <button
                          className="admin-restock-button"
                          disabled={savingId !== null}
                          onClick={() => restock(book)}
                        >
                          {savingId === book.id
                            ? "Saving..."
                            : "Restock"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </main>
      <Footer />
    </div>
  );
}
