import { useState } from "react";
import api from "../services/api";

function AdminManageAdmins() {
  const [formStatus, setFormStatus] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormStatus({ type: "", text: "" });
  };

  const validateForm = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
      return "Please fill in all admin details.";
    }

    if (!/^[A-Za-z ]{2,}$/.test(form.name.trim())) {
      return "Name should contain only letters and spaces.";
    }

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(form.email.trim())) {
      return "Email must be a valid @gmail.com address.";
    }

    if (!/^\d{10}$/.test(form.phone.trim())) {
      return "Phone number must be exactly 10 digits.";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormStatus({ type: "error", text: validationError });
      return;
    }

    try {
      setSubmitting(true);
      setFormStatus({ type: "", text: "" });

      await api.post("/auth/admins", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password
      });

      setFormStatus({ type: "success", text: "Admin registered successfully." });
      setForm({ name: "", email: "", phone: "", password: "" });
    } catch (err) {
      setFormStatus({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to create admin."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <span className="chip">Add admin</span>
        <h1>Create an admin entry in one simple form.</h1>
        <p>
          Fill this form once and save the admin directly into the users table.
        </p>
        <div className="hero-points">
          <div>Simple form</div>
          <div>Saves to database</div>
          <div>Admin entry only</div>
        </div>
      </section>

      <section className="auth-card">
        <div>
          <p className="section-kicker">Create admin</p>
          <h2>Add admin entry</h2>
          <p className="muted-text">Enter the admin details you want to save in the users table.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input
              name="name"
              type="text"
              placeholder="Enter full name"
              value={form.name}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Phone</span>
            <input
              name="phone"
              type="text"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Password</span>
            <div className="password-field">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
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

          <button className="btn btn-primary wide" disabled={submitting} type="submit">
            {submitting ? "Adding admin..." : "Add admin"}
          </button>

          {formStatus.text && (
            <p className={formStatus.type === "success" ? "field-success" : "field-error"}>
              {formStatus.text}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}

export default AdminManageAdmins;
