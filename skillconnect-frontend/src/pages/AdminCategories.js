import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../Services/api";

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formError, setFormError] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/categories");
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setCategories(list);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.response?.data?.error || "Unable to load categories."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      setMessage({ type: "", text: "" });
      await api.post("/admin/categories", { name: name.trim() });
      setName("");
      setMessage({ type: "success", text: "Category added successfully." });
      await fetchCategories();
    } catch (err) {
      setFormError(
        err.response?.data?.message || err.response?.data?.error || "Unable to add category."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
    try {
      setActionId(categoryId);
      setMessage({ type: "", text: "" });
      await api.delete(`/admin/categories/${categoryId}`);
      setMessage({ type: "success", text: "Category removed successfully." });
      await fetchCategories();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.response?.data?.error || "Unable to remove category."
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="content-shell">
        <section className="hero-panel">
          <div>
            <span className="chip">Categories</span>
            <h2>Add and remove categories.</h2>
            <p>Admin can create categories and remove them from this page.</p>
          </div>

          <div className="hero-meta provider-stats">
            <div>
              <strong>{categories.length}</strong>
              <span>Total categories</span>
            </div>
          </div>
        </section>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <section className="provider-layout">
          <aside className="panel-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Add category</p>
                <h3>Create a category</h3>
              </div>
            </div>

            <form className="stack-form" onSubmit={handleSubmit}>
              <label>
                <span>Category name</span>
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setFormError("");
                  }}
                  placeholder="Enter category name"
                />
              </label>

              <button className="btn btn-primary" disabled={submitting} type="submit">
                {submitting ? "Adding..." : "Add category"}
              </button>

              {formError && <p className="field-error">{formError}</p>}
            </form>
          </aside>

          <section className="panel-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Category list</p>
                <h3>Existing categories</h3>
              </div>
            </div>

            {loading ? (
              <p className="muted-text">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="muted-text">No categories found.</p>
            ) : (
              <div className="mini-service-list">
                {categories.map((category) => (
                  <article className="mini-service-item" key={category.id}>
                    <div>
                      <strong>{category.name}</strong>
                    </div>
                    <button
                      className="btn btn-danger"
                      type="button"
                      disabled={actionId === category.id}
                      onClick={() => handleDelete(category.id)}
                    >
                      Remove
                    </button>
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

export default AdminCategories;
