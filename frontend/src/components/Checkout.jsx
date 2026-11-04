import { API_URL } from "../config/api.js";
import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {useCart} from "../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";

function Checkout() {
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    country: "Sri Lanka",
    street: "",
    apartment: "",
    city: "",
    phone: "",
    confirmPhone: "",
  });

  const [delivery, setDelivery] = useState("home");
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();

  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Update form fields
  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Format prices
  const formatPrice = (price) => {
    return `Rs. ${price.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate subtotal
  const subtotal = cartItems.reduce(
    (total, book) => total + book.price * book.quantity,0
  );

  // Calculate shipping
  const shipping = delivery === "home" ? 450 : 0;

  // Calculate total
  const total = subtotal + shipping;

  
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (placingOrder) return; //prevents the handler from starting another request while one is already being processed.

    setOrderError("");

    if (cartItems.length === 0) {
      setOrderError("Your cart is empty.");
      return;
    }

    if (form.phone !== form.confirmPhone) {
      setOrderError("Phone numbers do not match.");
      return;
    }

    // Prepare the request expected by Express.
    const orderData = {
      customer: {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        country: form.country,
        street: form.street,
        apartment: form.apartment,
        city: form.city,
        phone: form.phone,
      },
      items: cartItems.map((book) => ({
        id: book.id,
        quantity: book.quantity,
      })),
      deliveryMethod: delivery,
    };

    setPlacingOrder(true);

    try {
      const response = await fetch(
        `${API_URL}/api/orders/guest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(orderData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setOrderError(data.message || "Unable to place order.");
        return;
      }

      // The backend confirmed the order was saved.
      const savedOrder = data.order;

      console.log("Order successfully saved to database", {
        orderId: savedOrder.orderId,
        placedAt: savedOrder.placedAt,
        items: savedOrder.items,
        subtotal: savedOrder.subtotal,
        deliveryFee: savedOrder.deliveryFee,
        total: savedOrder.total
      });

      clearCart();

      navigate("/order-success", {
        replace: true,
        state: { order: savedOrder },
      });

    } catch (error) {
      console.error("Checkout error:", error);
      setOrderError("Unable to connect to the server. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };


  return (
    <>
      {/* NAVBAR */}
      <Navbar />

      <main className="checkout-page">
        <div className="checkout-container">

          <h1 className="checkout-title">CHECKOUT DETAILS</h1>

          <form
            className="checkout-layout"
            onSubmit={handleSubmit}
          >

            {/* =========================
                BILLING DETAILS
            ========================= */}

            <section className="checkout-billing">
              <h2>Billing Details</h2>

              <div className="checkout-field">
                <label htmlFor="checkout-email">
                  Email address *
                </label>

                <input
                  id="checkout-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateForm}
                  required
                />
              </div>

              <div className="checkout-field-row">

                <div className="checkout-field">
                  <label htmlFor="checkout-first-name">
                    First name *
                  </label>

                  <input
                    id="checkout-first-name"
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={updateForm}
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="checkout-last-name">
                    Last name *
                  </label>

                  <input
                    id="checkout-last-name"
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={updateForm}
                    required
                  />
                </div>

              </div>

              <div className="checkout-field">
                <label htmlFor="checkout-country">
                  Country / Region *
                </label>

                <select
                  id="checkout-country"
                  name="country"
                  value={form.country}
                  onChange={updateForm}
                  required
                >
                  <option value="Sri Lanka">
                    Sri Lanka
                  </option>
                </select>
              </div>

              <div className="checkout-field">
                <label htmlFor="checkout-street">
                  Street address *
                </label>

                <input
                  id="checkout-street"
                  type="text"
                  name="street"
                  placeholder="House number and street name"
                  value={form.street}
                  onChange={updateForm}
                  required
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="checkout-apartment">
                  Apartment / Suite (optional)
                </label>

                <input
                  id="checkout-apartment"
                  type="text"
                  name="apartment"
                  placeholder="Apartment, suite, unit, etc."
                  value={form.apartment}
                  onChange={updateForm}
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="checkout-city">
                  Town / City *
                </label>

                <input
                  id="checkout-city"
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={updateForm}
                  required
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="checkout-phone">
                  Phone Number *
                </label>

                <input
                  id="checkout-phone"
                  type="tel"
                  name="phone"
                  placeholder="0777123456"
                  value={form.phone}
                  onChange={updateForm}
                  required
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="checkout-confirm-phone">
                  Re-type Phone Number *
                </label>

                <input
                  id="checkout-confirm-phone"
                  type="tel"
                  name="confirmPhone"
                  placeholder="0777123456"
                  value={form.confirmPhone}
                  onChange={updateForm}
                  required
                />
              </div>

            </section>

            {/* =========================
                ORDER SUMMARY
            ========================= */}

            <aside className="checkout-summary">

              <h2>Your Order</h2>

              {/* Product and subtotal headings */}
              <div className="checkout-summary-header">
                <span>Product</span>
                <span>Subtotal</span>
              </div>

              {/* Products */}
              {cartItems.map((book) => (
                <div
                  className="checkout-summary-row"
                  key={book.id}
                >
                  <span>
                    {book.title} × {book.quantity}
                  </span>

                  <strong>
                    {formatPrice(
                      book.price * book.quantity
                    )}
                  </strong>
                </div>
              ))}

              {/* Subtotal */}
              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              {/* Shipment */}
              <div className="checkout-shipping">
                <h3>Shipment</h3>

                <label>
                  <input
                    type="radio"
                    name="delivery"
                    value="home"
                    checked={delivery === "home"}
                    onChange={(event) =>
                      setDelivery(event.target.value)
                    }
                  />

                  <span>
                    Home Delivery (2–5 days):
                    {" "}
                    {formatPrice(450)}
                  </span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={delivery === "pickup"}
                    onChange={(event) =>
                      setDelivery(event.target.value)
                    }
                  />

                  <span>
                    Pickup from Warehouse: FREE
                  </span>
                </label>

                {delivery === "home" ? (
                  <p className="checkout-delivery-note">
                    Delivery takes 2–5 working days.
                    Your order will be shipped on the
                    next working day. You will be notified
                    when your order is dispatched.
                  </p>
                ) : (
                  <p className="checkout-delivery-note">
                    Your order will be prepared for pickup.
                    You will be notified when it is ready
                    for collection.
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="checkout-summary-row checkout-total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              {/* Cash on Delivery */}
              <div className="checkout-payment">
                <h3>Payment Method</h3>

                <div className="checkout-cod">
                  <span className="checkout-cod-indicator"></span>

                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when you receive your order.</p>
                  </div>
                </div>
              </div>

              {orderError && (
                <p role="alert" style={{ color: "#b42318" }}>
                  {orderError}
                </p>
              )}

              <button
                  type="submit"
                  className="checkout-place-order"
                  disabled={placingOrder || cartItems.length === 0}
              >
                  {placingOrder ? "Placing Order..." : "Place Order"}
                </button>

            </aside>

          </form>
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </>
  );
}

export default Checkout;
