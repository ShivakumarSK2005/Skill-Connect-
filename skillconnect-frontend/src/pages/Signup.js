import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../Services/api";

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "customer"
};

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isDisabled = useMemo(() => {
    return (
      loading ||
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.phone.trim() ||
      !form.role
    );
  }, [form, loading]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await api.post("/auth/signup", form);
      setSuccess("Signup successful. Redirecting to login...");
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.error || "Signup failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell signup-shell">
      <section className="auth-hero compact">
        <span className="chip">Join Skill Connect</span>
        <h1>Create your marketplace account.</h1>
        <p>
          Customers can book trusted providers, and providers can manage bookings,
          requests, and service visibility from one place.
        </p>
      </section>

      <section className="auth-card">
        <div>
          <p className="section-kicker">Get started</p>
          <h2>Sign up</h2>
          <p className="muted-text">Choose the role that matches how you’ll use the app.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Shiva Kumar" />
          </label>

          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </label>

          <label>
            <span>Password</span>
            <div className="password-field">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
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

          <label>
            <span>Phone</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
            />
          </label>

          <label>
            <span>Role</span>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="customer">Customer</option>
              <option value="provider">Provider</option>
            </select>
          </label>

          {error && <div className="message error">{error}</div>}
          {success && <div className="message success">{success}</div>}

          <button className="btn btn-primary wide" type="submit" disabled={isDisabled}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="muted-text">
          Already registered? <Link to="/">Login here</Link>
        </p>
      </section>
    </div>
  );
}

export default Signup;
