import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { API_URL } from "../config/api";

function Account() {
  const navigate = useNavigate();
  
  const { user, setUser, loading } = useAuth();

  useEffect(() => { //This handles someone manually opening `/account` while already logged in.
    if (!loading && user) {
      navigate(
        user.role === "admin" ? "/admin-dashboard" : "/my-profile",
        { replace: true }
      );
    }
  }, [user, loading, navigate]); //means the effect is reconsidered when one of these values changes.


  const [login, setLogin] = useState({
    email: "",
    password: "",
  });

  const [register, setRegister] = useState({
    full_name:"",
    email: "",
    password: "",
  });

  const handleLoginChange = (event) => {
    const { name, value } = event.target;

    setLogin((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegister((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Frontend-only login
  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(login),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }
      setUser(data.account);

      // Redirect according to account role
      if (data.account.role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/my-profile", { replace: true });
      }

    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to the backend.");
    }
};

  // Frontend-only registration
  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/register`,

        {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          credentials: "include",
          body: JSON.stringify(register)
        }
      );
      const data = await response.json();
      
      
      if (!response.ok) {
        alert(data.message);
        return;
      }

      setUser(data.account);
      navigate("/my-profile", { replace: true });

    }
    catch (error) {
      console.error("Registration error:", error);
    }

  };


  if (loading || user) { //This prevents the login and registration forms from appearing while authentication is loading or while an authenticated user is being redirected.
    return null;
  }

  return (
    <>
      <Navbar />

      <main className="account-page">
        <div className="account-container">

          <h1 className="account-title">Account</h1>

          <div className="account-layout">

            {/* LOGIN FORM */}
            <section className="account-box">
              <h2>Login</h2>

              <form
                className="account-form"
                onSubmit={handleLogin}
              >
                <div className="account-field">
                  <label htmlFor="login-email">
                    Email address *
                  </label>

                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    value={login.email}
                    onChange={handleLoginChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="account-field">
                  <label htmlFor="login-password">
                    Password *
                  </label>

                  <input
                    id="login-password"
                    type="password"
                    name="password"
                    value={login.password}
                    onChange={handleLoginChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="account-submit-btn"
                >
                  Login
                </button>
              </form>
            </section>

            {/* REGISTER FORM */}
            <section className="account-box">
              <h2>Register</h2>

              <form
                className="account-form"
                onSubmit={handleRegister}
              >
                <div className="account-field">
                  <label htmlFor="register-name">
                    Full Name *
                  </label>
                  <input id="register-name" 
                         type="text" 
                         name="full_name" 
                         value={register.full_name} 
                         onChange={handleRegisterChange} 
                         placeholder="Enter your full name" 
                         autoComplete="name"
                         maxLength= {150}
                         required />
                    
                </div>
                <div className="account-field">
                  <label htmlFor="register-email">
                    Email address *
                  </label>

                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    value={register.email}
                    onChange={handleRegisterChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="account-field">
                  <label htmlFor="register-password">
                    Password *
                  </label>

                  <input
                    id="register-password"
                    type="password"
                    name="password"
                    value={register.password}
                    onChange={handleRegisterChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="account-submit-btn"
                >
                  Register
                </button>
              </form>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Account;
