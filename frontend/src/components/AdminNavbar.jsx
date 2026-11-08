import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, UserRound, Menu, X } from "lucide-react";

export default function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/admin/books?search=${encodeURIComponent(searchTerm.trim())}`);
    setIsOpen(false);
  };

  return (
    <header className="site-header admin-site-header">
      <nav className="navbar">
        <Link to="/admin-dashboard" className="nav-logo">
          BOOK<span>MARKS</span>
        </Link>
        <div className={`nav-links ${isOpen ? "open" : ""}`}>
          <NavLink to="/admin/books" onClick={() => setIsOpen(false)}>Books</NavLink>
          <NavLink to="/admin/customers" onClick={() => setIsOpen(false)}>Customers</NavLink>
          <NavLink to="/admin/restock" onClick={() => setIsOpen(false)}>Restock Books</NavLink>
          <NavLink to="/admin/orders" onClick={() => setIsOpen(false)}>Orders</NavLink>
        </div>
        <form className="nav-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search books..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="nav-search-input"
          />
          <button type="submit" className="nav-search-btn" aria-label="Search books">
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
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>
    </header>
  );
}
