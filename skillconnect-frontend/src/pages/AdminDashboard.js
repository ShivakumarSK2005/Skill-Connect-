import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../Services/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    total_users: 0,
    total_services: 0,
    bookings_today: 0
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const adminActions = [
    {
      title: "Add Categories",
      description: "Create and organize service categories for the marketplace.",
      path: "/admin-categories"
    },
    {
      title: "Manage Users",
      description: "Remove customer and provider accounts when needed.",
      path: "/admin-users"
    },
    {
      title: "Manage Services",
      description: "Remove provider services from the marketplace without deleting booking history.",
      path: "/admin-services"
    },
    {
      title: "View Bookings",
      description: "See all bookings and filter them by today, week, month, year, or custom dates.",
      path: "/admin-bookings"
    },
    {
      title: "Profile",
      description: "Open the shared profile area for admin account details.",
      path: "/profile"
    }
  ];

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get("/admin/summary");
        setSummary(res.data?.data || res.data || {});
      } catch (err) {
        setMessage({
          type: "error",
          text: err.response?.data?.message || err.response?.data?.error || "Unable to load admin summary."
        });
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="app-shell">
      <Navbar />

      <main className="content-shell">
        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <section className="hero-panel">
          <div>
            <span className="chip">Admin dashboard</span>
            <h2>Manage Skill Connect from one place.</h2>
            <p>
              Track platform numbers here and move into categories, accounts, services,
              or bookings management when needed.
            </p>
          </div>

          <div className="hero-meta provider-stats">
            <div>
              <strong>{summary.total_users || 0}</strong>
              <span>Total users</span>
            </div>
            <div>
              <strong>{summary.total_services || 0}</strong>
              <span>Available services</span>
            </div>
            <div>
              <strong>{summary.bookings_today || 0}</strong>
              <span>Bookings today</span>
            </div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Quick actions</p>
              <h3>Admin tools</h3>
            </div>
          </div>

          <div className="mini-service-list">
            {adminActions.map((action) => (
              <article className="mini-service-item" key={action.title}>
                <div>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                </div>
                <button
                  className={action.title === "Add Categories" ? "btn btn-primary" : "btn btn-secondary"}
                  type="button"
                  onClick={() => navigate(action.path)}
                >
                  Open
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
