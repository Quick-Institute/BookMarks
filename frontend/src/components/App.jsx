import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './Home.jsx'
import Shop from './Shop.jsx'
import About from './About.jsx'
import Checkout from './Checkout.jsx'
import Cart from './Cart.jsx'
import MyProfile from './MyProfile.jsx'
import Account from './Account.jsx'
import BookDetails from './BookDetails.jsx'
import { CartProvider } from "../context/CartContext.jsx";
import OrderSuccess from "./OrderSuccess.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";
import { BookProvider } from "../context/BookContext.jsx";
import AuthorDetails from "./AuthorDetails.jsx";
import AdminProfile from "./AdminProfile.jsx";
import AdminDashboard from './AdminDashboard.jsx'
import AdminBooks from "./AdminBooks.jsx";
import AdminBookDetails from "./AdminBookDetails.jsx";
import AdminCustomers from "./AdminCustomers.jsx";
import AdminCustomerDetails from "./AdminCustomerDetails.jsx";
import AdminOrders from "./AdminOrders.jsx";
import AdminOrderDetails from "./AdminOrderDetails.jsx";
import AdminRestockBooks from "./AdminRestockBooks.jsx";



function App() {
  // const [count, setCount] = useState(0)

  return (
    <Router>
      <AuthProvider>
        <BookProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/books" element={<Shop />} />
              <Route path="/about" element={<About />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/my-profile" element={<MyProfile />} />
              <Route path="/account" element={<Account />} />
              <Route path="/book/:id" element={<BookDetails />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/authors/:id" element={<AuthorDetails />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} /> 
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="/admin/books" element={<AdminBooks />} />
              <Route path="/admin/books/:id" element={<AdminBookDetails />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/customers/:id" element={<AdminCustomerDetails />} />
              <Route path="/admin/orders" element={<AdminOrders />}/>
              <Route path="/admin/orders/:id" element={<AdminOrderDetails />}/>
              <Route path="/admin/restock" element={<AdminRestockBooks />}/>
            </Routes>
          </CartProvider>
        </BookProvider>
      </AuthProvider>
    </Router>
     
  )
}

export default App
