import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../services/api";
import { decodeToken, getCurrentUser, setToken } from "../services/auth";

function AdminLogin() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isDisabled = useMemo(
    () => !form.email.trim() || !form.password.trim() || loading,
    [form.email, form.password, loading]
  );

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isDisabled) {
      setError("Please enter admin email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/login", form);
      const token = res.data?.token;
      const user = decodeToken(token);

      if (!token || user?.role !== "admin") {
        throw new Error("This account is not an admin account.");
      }

      setToken(token);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Admin login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <span className="chip">Admin access</span>
        <h1>Run Skill Connect from a dedicated admin app.</h1>
        <p>
          This admin app is fully separate from the customer and provider frontend.
          Sign in with a user whose role is `admin`.
        </p>
        <div className="hero-points">
          <div>Separate admin frontend</div>
          <div>Admin-only routes</div>
          <div>Connected to your backend</div>
        </div>
      </section>

      <section className="auth-card">
        <div>
          <p className="section-kicker">Admin portal</p>
          <h2>Admin login</h2>
          <p className="muted-text">Use the admin email ID and password from the users table.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Admin email</span>
            <input
              name="email"
              type="email"
              placeholder="admin@example.com"
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
            {loading ? "Signing in..." : "Login as admin"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default AdminLogin;
