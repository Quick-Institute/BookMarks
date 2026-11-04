import { API_URL } from "../config/api.js";

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Navbar from "./Navbar";
import Footer from "./Footer";

import { useCart } from "../context/CartContext.jsx";
import { useBooks } from "../context/BookContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";



function BookDetails() {
  const { id } = useParams();

  const { books, loading, error } = useBooks();
  const { addToCart } = useCart();
  const { user, loading: authLoading } = useAuth();

  const book = books.find(
    (item) => String(item.id) === String(id)
  );

  // Shopping cart state
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState("");

  // Rating state
  const [userRating, setUserRating] = useState(0);
  const [savedRating, setSavedRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);

  const [averageRating, setAverageRating] = useState(null);
  const [totalRatings, setTotalRatings] = useState(0);

  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [myRatingLoading, setMyRatingLoading] = useState(false);
  const [ratingSaving, setRatingSaving] = useState(false);

  const [ratingError, setRatingError] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");

  // Load public rating summary
  useEffect(() => {
    const controller = new AbortController();

    const loadRatingSummary = async () => {
      setRatingsLoading(true);
      setRatingError("");
      setAverageRating(null);
      setTotalRatings(0);

      try {
        const response = await fetch(
          `${API_URL}/api/books/${id}/ratings`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load book ratings.");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setAverageRating(data.average_rating);
          setTotalRatings(data.total_ratings);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setRatingError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setRatingsLoading(false);
        }
      }
    };

    loadRatingSummary();

    return () => controller.abort();
  }, [id]);

  // Load the logged-in customer's previous rating
  useEffect(() => {
    const controller = new AbortController();

    setUserRating(0);
    setSavedRating(null);
    setHoverRating(0);
    setRatingMessage("");

    if (authLoading || !user || user.role !== "customer") {
      setMyRatingLoading(false);
      return () => controller.abort();
    }

    const loadMyRating = async () => {
      setMyRatingLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/api/books/${id}/ratings/me`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load your rating.");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setSavedRating(data.rating);
          setUserRating(data.rating ?? 0);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setRatingError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setMyRatingLoading(false);
        }
      }
    };

    loadMyRating();

    return () => controller.abort();
  }, [id, user?.account_id, user?.role, authLoading]);

  // Format book price
  const formatPrice = (price) =>
    `Rs. ${Number(price).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Quantity controls
  const increaseQuantity = () => {
    setQuantity((previous) => previous + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((previous) => Math.max(1, previous - 1));
  };

  // Add book to cart
  const handleAddToCart = () => {
    addToCart(book, quantity);

    setCartMessage(
      `${quantity} × ${book.title} added to cart successfully!`
    );
  };

  // Submit rating to backend
  const handleSubmitRating = async () => {
    setRatingError("");
    setRatingMessage("");

    if (!user || user.role !== "customer") {
      setRatingError("Please sign in as a customer to rate books.");
      return;
    }

    if (userRating < 1 || userRating > 5) {
      setRatingError("Please select a rating from 1 to 5 stars.");
      return;
    }

    setRatingSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/books/${id}/ratings`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: userRating,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save your rating."
        );
      }

      // Update the page after a successful save
      setSavedRating(data.rating);
      setUserRating(data.rating);
      setAverageRating(data.average_rating);
      setTotalRatings(data.total_ratings);

      setRatingMessage(
        `Thank you! Your ${data.rating}-star rating has been saved.`
      );
    } catch (err) {
      setRatingError(err.message);
    } finally {
      setRatingSaving(false);
    }
  };

  // Existing loading and error states
  if (loading) {
    return <p>Loading book details...</p>;
  }

  if (error) {
    return <p>Unable to load book details: {error}</p>;
  }

  if (!book) {
    return (
      <>
        <Navbar />
        <main className="book-details-page">
          <div className="book-details-container">
            <h1>Book not found</h1>
            <p>We couldn't find the book you're looking for.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="book-details-page">
        <div className="book-details-container">
          <section className="book-details-layout">

            {/* BOOK COVER */}
            <div className="book-details-image-area">
              <img
                src={book.image}
                alt={book.title}
                className="book-details-image"
              />
            </div>

            {/* BOOK INFORMATION */}
            <div className="book-details-information">

              <p className="book-details-category">
                {book.category}
              </p>

              <h1>{book.title}</h1>

              <p className="book-details-author">
                by{" "}
                <Link
                  to={`/authors/${book.author_id}`}
                  className="book-author-link"
                >
                  {book.author}
                </Link>
              </p>

              <p className="book-details-price">
                {formatPrice(book.price)}
              </p>

              <h3>Description</h3>

              <p className="book-details-description">
                {book.description}
              </p>

              <p className="book-details-description">
                {book.details}
              </p>

              {/* QUANTITY AND CART */}
              <div className="book-details-actions">
                <div className="book-details-quantity">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity === 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="book-details-cart-btn"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </button>
              </div>

              {cartMessage && (
                <p className="book-cart-success" role="status">
                  {cartMessage}
                </p>
              )}

              {/* PRODUCT DETAILS */}
              <div className="book-details-extra">
                <h2>Product Details</h2>

                <p>
                  Discover more about this edition of{" "}
                  {book.title}.
                </p>

                <div className="book-details-specs">
                  <div>
                    <span>Author</span>
                    <strong>
                      <Link to={`/authors/${book.author_id}`}>
                        {book.author}
                      </Link>
                    </strong>
                  </div>

                  <div>
                    <span>Publisher</span>
                    <strong>{book.publisher}</strong>
                  </div>

                  <div>
                    <span>Language</span>
                    <strong>{book.language}</strong>
                  </div>

                  <div>
                    <span>Format</span>
                    <strong>{book.format}</strong>
                  </div>
                </div>
              </div>

              {/* CUSTOMER RATINGS */}
              <div className="book-details-reviews">
                <h2>Customer Ratings</h2>

                {/* OVERALL RATING */}
                <div className="book-overall-rating">
                  <div
                    className="book-overall-stars"
                    aria-hidden="true"
                  >
                    {averageRating === null
                      ? "☆☆☆☆☆"
                      : [1, 2, 3, 4, 5]
                          .map((star) =>
                            star <= Math.round(averageRating)
                              ? "★"
                              : "☆"
                          )
                          .join("")}
                  </div>

                  <strong>
                    {ratingsLoading
                      ? "Loading..."
                      : averageRating === null
                      ? "Not rated yet"
                      : `${Number(averageRating).toFixed(2)} / 5`}
                  </strong>

                  <span>
                    {totalRatings}{" "}
                    {totalRatings === 1 ? "rating" : "ratings"}
                  </span>
                </div>

                {/* GUEST VIEW */}
                {!authLoading && !user && (
                  <div className="book-rating-guest-card">

                    <div className="book-rating-guest-heading">
                      <div className="book-rating-guest-icon">
                        ★
                      </div>

                      <div>
                        <h3>Share your rating</h3>
                        <p>
                          What did you think of this book?
                        </p>
                      </div>
                    </div>

                    <div
                      className="book-rating-guest-stars"
                      aria-hidden="true"
                    >
                      ☆☆☆☆☆
                    </div>

                    <p className="book-rating-guest-description">
                      Sign in to select your stars and share your opinion.
                    </p>

                    <Link
                      to="/account"
                      state={{
                        from: `/book/${id}`,
                      }}
                      className="book-rating-guest-button"
                    >
                      Sign In to Rate
                    </Link>
                  </div>
                )}

                {/* NON-CUSTOMER VIEW */}
                {!authLoading &&
                  user &&
                  user.role !== "customer" && (
                    <p>
                      Only customer accounts can submit ratings.
                    </p>
                  )}

                {/* LOGGED-IN CUSTOMER VIEW */}
                {!authLoading &&
                  user?.role === "customer" && (
                    <div className="book-rating-customer">

                      <h3>
                        {savedRating !== null
                          ? "Update your rating"
                          : "Rate this book"}
                      </h3>

                      {myRatingLoading ? (
                        <p>Loading your rating...</p>
                      ) : (
                        <>
                          {savedRating !== null && (
                            <p className="book-rating-current">
                              Your current rating:{" "}
                              <strong>
                                {savedRating} / 5
                              </strong>
                            </p>
                          )}

                          <div
                            className="book-user-stars"
                            role="group"
                            aria-label="Select your rating"
                            onMouseLeave={() =>
                              setHoverRating(0)
                            }
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                type="button"
                                key={star}
                                disabled={ratingSaving}
                                onClick={() => {
                                  setUserRating(star);
                                  setRatingMessage("");
                                }}
                                onMouseEnter={() =>
                                  setHoverRating(star)
                                }
                                aria-label={`Rate ${star} out of 5`}
                                aria-pressed={userRating === star}
                                className={
                                  star <= (hoverRating || userRating)
                                    ? "selected"
                                    : ""
                                }
                              >
                                ★
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            className="book-rating-submit"
                            onClick={handleSubmitRating}
                            disabled={
                              ratingSaving ||
                              userRating === 0
                            }
                          >
                            {ratingSaving
                              ? "Saving..."
                              : savedRating !== null
                              ? "Update Rating"
                              : "Submit Rating"}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                {ratingMessage && (
                  <p
                    className="book-rating-message"
                    role="status"
                  >
                    {ratingMessage}
                  </p>
                )}

                {ratingError && (
                  <p
                    className="book-rating-error"
                    role="alert"
                  >
                    {ratingError}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default BookDetails;
