import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import BookSection from "./BookSection.jsx";
import Footer from "./Footer.jsx";
import { useBooks } from "../context/BookContext.jsx";
import { API_URL } from "../config/api";


const filters = ["All", "Fiction", "Fantasy", "Dystopian", "Self Help"];

export default function Shop() {
  const { books, loading, error } = useBooks();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [authors, setAuthors] = useState([]);
  const [authorsLoading, setAuthorsLoading] = useState(false);
  const [authorsError, setAuthorsError] = useState("");

  // Navbar sends searches to /books?search=your-keyword.
  const rawSearch = (searchParams.get("search") || "").trim();
  const searchTerm = rawSearch.toLowerCase();
  useEffect(() => {
    // Clear previous author results
    setAuthors([]);
    setAuthorsError("");

    if (!searchTerm) {
      setAuthorsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchAuthors = async () => {
      setAuthorsLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/api/authors/search?q=${encodeURIComponent(searchTerm)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to search authors");
        }

        const data = await response.json();
        setAuthors(data.authors || []);

      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Author search error:", error);
          setAuthorsError("Unable to load matching authors.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setAuthorsLoading(false);
        }
      }
    };

    fetchAuthors();

    return () => controller.abort();
  }, [searchTerm]);



  const filtered = books.filter((book) => {
    const matchesCategory =
      category === "All" ||
      book.genre?.toLowerCase() === category.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      [book.title, book.author, book.genre, book.description, book.isbn].some(
        (value) => String(value ?? "").toLowerCase().includes(searchTerm)
      );

    return matchesCategory && matchesSearch;
  });

  const shown = [...filtered].sort((a, b) =>
    sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : 0
  );

  return (
    <div className="bm-editorial bm-shop">
      <Navbar />
      <main>
        <section className="bm-hero" aria-label="BookMarks shop">
          <img src="/shop.webp" alt="Explore the BookMarks collection" />
        </section>

        <header className="bm-shop-intro">
          <span className="bm-kicker">THE BOOKMARKS BOOKSHELF</span>
          <h1>
            {rawSearch ? `Search results for "${rawSearch}"` : "Browse our books"}
          </h1>
          <p>Explore our collection and find something worth turning the page for.</p>
        </header>

                
        {searchTerm && (
          <section className="bm-author-results">
            <h2>Matching Authors</h2>

            {authorsLoading && <p>Searching authors...</p>}

            {authorsError && (
              <p role="alert">{authorsError}</p>
            )}

            {!authorsLoading && !authorsError && authors.length > 0 && (
              <div className="bm-author-results-grid">
                {authors.map((author) => (
                  <Link
                    key={author.author_id}
                    to={`/authors/${author.author_id}`}
                    className="bm-author-result-card"
                  >
                    <img
                      src={author.image_url || "/images/no-author.jpg"}
                      alt={author.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />

                    <div>
                      <h3>{author.name}</h3>
                      <span>View author profile →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!authorsLoading && !authorsError && authors.length === 0 && (
              <p>No matching author profiles found.</p>
            )}
          </section>
        )}

        <section className="bm-shop-catalog" aria-label="Browse books">
          <div className="bm-shop-toolbar">
            <div className="bm-filter-list" aria-label="Filter by genre">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={category === filter ? "bm-filter active" : "bm-filter"}
                  onClick={() => setCategory(filter)}
                  aria-pressed={category === filter}
                >
                  {filter === "All" ? "All books" : filter}
                </button>
              ))}
            </div>
            <label className="bm-sort">
              Sort by{" "}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </label>
          </div>

          {loading ? (
            <p className="bm-results">Loading books...</p>
          ) : error ? (
            <p className="bm-empty">Unable to load books: {error}</p>
          ) : (
            <>
              <p className="bm-results">
                {shown.length} {shown.length === 1 ? "book" : "books"}
              </p>
              {shown.length ? (
                <BookSection
                  title={rawSearch ? "Matching books" : category === "All" ? "All books" : category}
                  books={shown}
                />
              ) : (
                <p className="bm-empty">
                  {rawSearch
                    ? "No books found matching your search. Try another keyword or genre."
                    : "No books in this category yet. Try another genre."}
                </p>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
