import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { API_URL } from "../config/api";

function AuthorDetails() {
  const { id } = useParams();

  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchAuthor = async () => {
      setLoading(true);
      setError("");
      setAuthor(null);
      setBooks([]);

      try {
        const response = await fetch(
          `${API_URL}/api/authors/${id}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Author not found."
              : "Unable to load author details."
          );
        }

        const data = await response.json();

        setAuthor(data.author);
        setBooks(data.books);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAuthor();

    return () => controller.abort();
  }, [id]);

  const formatPrice = (price) =>
    `Rs. ${Number(price).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <>
      <Navbar />

      <main className="author-page author-page-redesign">
        <div className="author-container">
          <Link to="/books" className="author-back-link">
            ← Back to Books
          </Link>

          {loading ? (
            <p>Loading author details...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : author ? (
            <>
              <section className="author-editorial-hero">
                <div className="author-editorial-photo">
                  <img
                    src={
                      author.image_url ||
                      "/images/authors/default-author.png"
                    }
                    alt={author.name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "/images/authors/default-author.png";
                    }}
                  />
                </div>

                <div className="author-editorial-content">
                  <p className="author-editorial-kicker">
                    THE WRITERS BEHIND THE STORIES
                  </p>

                  <h1>{author.name}</h1>

                  <div className="author-editorial-rule" />

                  <h2>Meet the Author</h2>

                  <p className="author-editorial-bio">
                    {author.biography ||
                      "Get to know the writer behind the books. More about this author is coming soon."}
                  </p>

                  <div className="author-editorial-bottom">
                    <div>
                      <strong>{books.length}</strong>
                      <span>
                        {books.length === 1
                          ? "Book in our collection"
                          : "Books in our collection"}
                      </span>
                    </div>

                    <a href="#author-collection">
                      Explore the Books <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              </section>

              <section
                className="author-editorial-collection"
                id="author-collection"
              >
                <div className="author-editorial-heading">
                  <div>
                    <p className="author-editorial-kicker">
                      DISCOVER THE COLLECTION
                    </p>
                    <h2>Books by {author.name}</h2>
                    <p>
                      Explore the books by this author available
                      at BookMarks.
                    </p>
                  </div>

                  <Link to="/books" className="author-shop-link">
                    Browse All Books →
                  </Link>
                </div>

                {books.length === 0 ? (
                  <p>No books are currently available.</p>
                ) : (
                  <div className="author-editorial-grid">
                    {books.map((book) => (
                      <Link
                        key={book.id}
                        to={`/book/${book.id}`}
                        className="author-editorial-book"
                      >
                        <div className="author-editorial-cover">
                          <img
                            src={
                              book.image ||
                              "/images/no-cover.jpg"
                            }
                            alt={book.title}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src =
                                "/images/no-cover.jpg";
                            }}
                          />
                        </div>

                        <div className="author-editorial-book-info">
                          <span>{book.genre}</span>
                          <h3>{book.title}</h3>
                          <p>{book.author}</p>
                          <strong>{formatPrice(book.price)}</strong>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <p>Author not found.</p>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default AuthorDetails;
