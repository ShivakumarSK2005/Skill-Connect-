import { useEffect, useMemo, useState } from "react";
import AdminNavbar from "../components/AdminNavbar";
import api from "../services/api";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setUsers(list);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.response?.data?.error || "Unable to load users."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(
    () => users.filter((user) => filter === "all" || user.role === filter),
    [filter, users]
  );

  const handleDelete = async (userId) => {
    try {
      setActionId(userId);
      setMessage({ type: "", text: "" });
      await api.delete(`/admin/users/${userId}`);
      setMessage({ type: "success", text: "User removed successfully." });
      await fetchUsers();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.response?.data?.error || "Unable to remove user."
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="app-shell">
      <AdminNavbar />

      <main className="content-shell">
        <section className="hero-panel">
          <div>
            <span className="chip">Users</span>
            <h2>Manage customer and provider accounts.</h2>
            <p>Admin can remove only customer and provider users from this page.</p>
          </div>

          <div className="hero-meta provider-stats">
            <div>
              <strong>{users.filter((user) => user.role === "customer").length}</strong>
              <span>Customers</span>
            </div>
            <div>
              <strong>{users.filter((user) => user.role === "provider").length}</strong>
              <span>Providers</span>
            </div>
          </div>
        </section>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <section className="panel-card">
          <div className="panel-head panel-head-inline">
            <div>
              <p className="section-kicker">Manage users</p>
              <h3>Customer and provider list</h3>
            </div>

            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All users</option>
              <option value="customer">Customers</option>
              <option value="provider">Providers</option>
            </select>
          </div>

          {loading ? (
            <p className="muted-text">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="muted-text">No users found for this filter.</p>
          ) : (
            <div className="mini-service-list">
              {filteredUsers.map((user) => (
                <article className="mini-service-item" key={user.id}>
                  <div>
                    <strong>{user.name}</strong>
                    <p>{user.email}</p>
                    <p>{user.phone}</p>
                    <p>Role: {user.role}</p>
                  </div>
                  <button
                    className="btn btn-danger"
                    type="button"
                    disabled={actionId === user.id}
                    onClick={() => handleDelete(user.id)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminUsers;
