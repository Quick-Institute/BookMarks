import { API_URL } from "../config/api.js";
import { createContext, useContext, useEffect, useState } from "react";

const BookContext = createContext(null);

export function BookProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshBooks = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/books`);

      if (!response.ok) {
        throw new Error("Failed to load books");
      }

      const data = await response.json();
      setBooks(data.books);
    } catch (error) {
      console.error("Book loading error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBooks();
  }, []);

  return (
    <BookContext.Provider value={{ books, loading, error, refreshBooks }}>
      {children}
    </BookContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BookContext);

  if (!context) {
    throw new Error("useBooks must be used inside BookProvider");
  }

  return context;
}
