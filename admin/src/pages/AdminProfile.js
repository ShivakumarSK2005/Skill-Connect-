import { useEffect, useState } from "react";
import AdminNavbar from "../components/AdminNavbar";
import api from "../services/api";

function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get("/auth/profile");
        setProfile(res.data?.data || res.data);
      } catch (err) {
        setMessage({
          type: "error",
          text:
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to load profile."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="app-shell">
      <AdminNavbar />

      <main className="content-shell">
        <section className="hero-panel">
          <div>
            <span className="chip">Admin profile</span>
            <h2>Review the current admin account.</h2>
            <p>
              This uses the same protected profile endpoint and keeps the admin app
              separate from your customer and provider frontend.
            </p>
          </div>
        </section>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <section className="panel-card profile-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Profile details</p>
              <h3>Current admin</h3>
            </div>
          </div>

          {loading ? (
            <p className="muted-text">Loading profile...</p>
          ) : !profile ? (
            <p className="muted-text">No profile data found.</p>
          ) : (
            <div className="stack-form">
              <label>
                <span>Name</span>
                <input readOnly value={profile.name || ""} />
              </label>
              <label>
                <span>Email</span>
                <input readOnly value={profile.email || ""} />
              </label>
              <label>
                <span>Phone</span>
                <input readOnly value={profile.phone || ""} />
              </label>
              <label>
                <span>Role</span>
                <input readOnly value={profile.role || ""} />
              </label>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminProfile;
