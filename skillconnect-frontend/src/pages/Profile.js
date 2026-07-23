import { useEffect, useState } from "react";
import LoadingState from "../components/LoadingState";
import Navbar from "../components/Navbar";
import api from "../Services/api";
import { getCurrentUser } from "../Services/auth";

function Profile() {
  const user = getCurrentUser();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: user?.role || ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get("/auth/profile");
        const profile = res.data || {};
        setForm({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          role: profile.role || user?.role || ""
        });
      } catch (err) {
        setMessage({
          type: "error",
          text:
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to load your profile."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      setMessage({ type: "error", text: "Name and phone are required." });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: "", text: "" });
      await api.put("/auth/profile", {
        name: form.name,
        phone: form.phone
      });
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to update your profile."
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="content-shell">
        <section className="hero-panel compact-panel">
          <div>
            <span className="chip">Account settings</span>
            <h2>Review and update your profile.</h2>
            <p>Keep your contact details current so bookings and communication stay smooth.</p>
          </div>
        </section>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        {loading ? (
          <LoadingState label="Loading your profile..." />
        ) : (
          <section className="panel-card profile-panel">
            <div className="details-header">
              <div>
                <p className="section-kicker">Your details</p>
                <h3>{form.name || "Profile"}</h3>
                <p className="muted-text">Review your details and edit them only when needed.</p>
              </div>

              {!isEditing ? (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    setMessage({ type: "", text: "" });
                    setIsEditing(true);
                  }}
                >
                  Edit profile
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setMessage({ type: "", text: "" });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            <form className="stack-form" onSubmit={handleSubmit}>
              <label>
                <span>Name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                />
              </label>

              <label>
                <span>Email</span>
                <input name="email" value={form.email} disabled readOnly />
              </label>

              <label>
                <span>Phone</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                />
              </label>

              <label>
                <span>Role</span>
                <input value={form.role} disabled readOnly />
              </label>

              {isEditing && (
                <button className="btn btn-primary wide" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              )}
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default Profile;
