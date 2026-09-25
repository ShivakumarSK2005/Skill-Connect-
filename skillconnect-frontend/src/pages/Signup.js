import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../Services/api";
import logoImg from "../skill-connect-logo.jpg";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  role: "customer"
};

/**
 * WHAT IT DOES:
 *   Registration page allowing new users to sign up as either a "Customer" or a "Service Provider".
 * 
 * WHY WE ADDED IT:
 *   - Onboarding: Collects contact information, password, and designated marketplace role.
 *   - Pre-validation: Enforces password length restrictions (>= 6 characters) and required fields
 *     before dispatching the network request.
 * 
 * HOW IT WORKS:
 *   1. Maintains form fields in state defaulting `role = "customer"`.
 *   2. `isDisabled` dynamically prevents submission if required fields are missing.
 *   3. On submit, validates password length and dispatches POST to `/api/auth/signup`.
 *   4. On success, displays a confirmation alert and navigates to the login screen after 900ms.
 */
function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isDisabled = useMemo(() => {
    return (
      loading ||
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.confirmPassword.trim() ||
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

    const emailPattern = /^[A-Za-z0-9._%+-]+@gmail\.com$/;
    if (!emailPattern.test(form.email.trim())) {
      setError("Please enter a valid Gmail address ending with @gmail.com");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please verify both passwords.");
      return;
    }

    const phonePattern = /^[6-9][0-9]{9}$/;
    if (!phonePattern.test(form.phone.trim())) {
      setError("Phone number must be a 10-digit number starting with 6, 7, 8, or 9.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        role: form.role
      };

      await api.post("/auth/signup", payload);
      setSuccess("Signup successful. Redirecting to login...");
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      if (serverMessage) {
        setError(serverMessage);
      } else if (err.message === "Network Error") {
        setError("Unable to connect to the backend server. Please verify your Render service is running.");
      } else {
        setError(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell signup-shell">
      <section className="auth-hero compact">
        <div className="auth-brand-badge">
          <img src={logoImg} alt="Skill Connect" className="auth-brand-logo" />
          <span>Skill Connect</span>
        </div>
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
          <p className="muted-text">Choose the role that matches how you will use the app.</p>
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
              placeholder="you@gmail.com"
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
            <span>Confirm Password</span>
            <div className="password-field">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
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
