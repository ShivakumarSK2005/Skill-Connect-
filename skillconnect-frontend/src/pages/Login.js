import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../Services/api";
import { decodeToken, getHomeRoute } from "../Services/auth";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isDisabled = useMemo(
    () => !form.email.trim() || !form.password.trim() || loading,
    [form.email, form.password, loading]
  );

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
