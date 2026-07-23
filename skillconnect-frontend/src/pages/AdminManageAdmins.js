import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../Services/api";

function AdminManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/admins");
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setAdmins(list);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load admins."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
      setFormError("Please fill in all admin details.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      setMessage({ type: "", text: "" });

      await api.post("/auth/admins", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password
      });

      setMessage({ type: "success", text: "Admin created successfully." });
      setForm({ name: "", email: "", phone: "", password: "" });
      await fetchAdmins();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to create admin."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="content-shell">
        <section className="hero-panel">
          <div>
            <span className="chip">Admin management</span>
            <h2>Create separate admin accounts.</h2>
            <p>
              This page is only for admins. Add new admin users here and they will be
              stored in the shared users table with the role set to `admin`.
            </p>
          </div>

          <div className="hero-meta provider-stats">
            <div>
              <strong>{admins.length}</strong>
              <span>Total admins</span>
            </div>
            <div>
              <strong>Users</strong>
              <span>Shared table</span>
            </div>
            <div>
              <strong>Admin</strong>
              <span>Role-based access</span>
            </div>
          </div>
        </section>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <section className="provider-layout admin-layout">
          <aside className="panel-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Create admin</p>
                <h3>Add a new admin</h3>
              </div>
            </div>

            <form className="stack-form" onSubmit={handleSubmit}>
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
                <input
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                />
              </label>

              <button className="btn btn-primary" disabled={submitting} type="submit">
                {submitting ? "Adding admin..." : "Add admin"}
              </button>

              {formError && <p className="field-error">{formError}</p>}
            </form>
          </aside>

          <section className="panel-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Admin list</p>
                <h3>Existing admins</h3>
              </div>
            </div>

            {loading ? (
              <p className="muted-text">Loading admins...</p>
            ) : admins.length === 0 ? (
              <p className="muted-text">No admins found yet.</p>
            ) : (
              <div className="mini-service-list">
                {admins.map((admin) => (
                  <article className="mini-service-item" key={admin.id}>
                    <div>
                      <strong>{admin.name}</strong>
                      <p>{admin.email}</p>
                      <p>{admin.phone || "No phone added"}</p>
                    </div>
                    <span className="category-pill">Admin</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default AdminManageAdmins;
