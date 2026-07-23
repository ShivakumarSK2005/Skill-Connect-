import AdminNavbar from "../components/AdminNavbar";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <AdminNavbar />

      <main className="content-shell">
        <section className="hero-panel">
          <div>
            <span className="chip">Admin dashboard</span>
            <h2>Admin login successful.</h2>
            <p>
              Use this page to manage categories and remove customer or provider accounts.
            </p>
          </div>

          <div className="hero-meta provider-stats">
            <div>
              <strong>Admin</strong>
              <span>Logged in</span>
            </div>
            <div>
              <strong>2</strong>
              <span>Management tools</span>
            </div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Admin tools</p>
              <h3>Choose what to manage</h3>
            </div>
          </div>

          <div className="mini-service-list">
            <article className="mini-service-item">
              <div>
                <strong>Manage Categories</strong>
                <p>Add new categories or remove existing ones.</p>
              </div>
              <button className="btn btn-primary" type="button" onClick={() => navigate("/categories")}>
                Open
              </button>
            </article>

            <article className="mini-service-item">
              <div>
                <strong>Manage Users</strong>
                <p>Remove customer and provider accounts when needed.</p>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => navigate("/users")}>
                Open
              </button>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
