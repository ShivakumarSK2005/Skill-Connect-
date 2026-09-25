import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../Services/api";
import { decodeToken, getHomeRoute } from "../Services/auth";
import logoImg from "../skill-connect-logo.jpg";

/**
 * WHAT IT DOES:
 *   Handles customer and service provider authentication. Manages form state, password visibility,
 *   submits credentials to `/auth/login`, validates role permissions, and redirects to the appropriate dashboard.
 * 
 * WHY WE ADDED IT:
 *   - Primary Authentication Gateway: Serves as the landing screen for returning users.
 *   - Role-Specific Gatekeeping: Ensures admin users cannot accidentally use the customer/provider login form
 *     (admins are directed to `/admin-login`).
 * 
 * HOW IT WORKS:
 *   1. Form state tracks `{ email, password }` and dynamic validation state (`isDisabled`).
 *   2. On submit, sends POST request to `/api/auth/login`.
 *   3. Decodes JWT using `decodeToken()` to extract user role.
 *   4. Persists token in `localStorage`.
 *   5. Calls `navigate(getHomeRoute(user.role))` to redirect to the user's role-specific landing page.
 */
function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Disables the submit button if inputs are empty or request is actively loading
  const isDisabled = useMemo(
    () => !form.email.trim() || !form.password.trim() || loading,
    [form.email, form.password, loading]
  );

  // Controlled input change handler
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isDisabled) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/login", form);
      const token = res.data?.token;
      const user = decodeToken(token);

      if (!token || !user?.role) {
        throw new Error("Invalid login response");
      }

      if (!["customer", "provider"].includes(user.role)) {
        throw new Error("This login page is only for customer and provider accounts.");
      }

      localStorage.setItem("token", token);
      navigate(getHomeRoute(user.role));
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-brand-badge">
          <img src={logoImg} alt="Skill Connect" className="auth-brand-logo" />
          <span>Skill Connect</span>
        </div>
        <span className="chip">Service marketplace</span>
        <h1>Book reliable professionals in minutes.</h1>
        <p>
          Skill Connect helps customers discover skilled providers and gives professionals
          a clean dashboard to manage every booking stage.
        </p>
        <div className="hero-points">
          <div>Verified categories</div>
          <div>Role-based booking flow</div>
          <div>Reviews after completion</div>
        </div>
      </section>

      <section className="auth-card">
        <div>
          <p className="section-kicker">Welcome back</p>
          <h2>Login to continue</h2>
          <p className="muted-text">Use your customer or provider account.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Password</span>
            <div className="password-field">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && <div className="message error">{error}</div>}

          <button className="btn btn-primary wide" type="submit" disabled={isDisabled}>
            {loading ? "Signing in..." : "Login"}
          </button>

          <button
            className="btn btn-secondary wide"
            type="button"
            onClick={() => navigate("/admin-login")}
          >
            Admin Login
          </button>
        </form>

        <p className="muted-text">
          New to Skill Connect? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </div>
  );
}

export default Login;
