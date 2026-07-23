import { NavLink, useNavigate } from "react-router-dom";
import { clearSession } from "../services/auth";

function AdminNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <header className="app-navbar">
      <div className="nav-brand-wrap">
        <button className="brand-mark" type="button" onClick={() => navigate("/dashboard")}>
          SC
        </button>
        <div>
          <p className="nav-eyebrow">Skill Connect</p>
          <h1 className="nav-title">Admin control center</h1>
        </div>
      </div>

      <nav className="nav-links">
        <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/dashboard">
          Dashboard
        </NavLink>
        <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/categories">
          Categories
        </NavLink>
        <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/users">
          Users
        </NavLink>
        <button className="btn btn-ghost" type="button" onClick={handleLogout}>
          Logout
        </button>
      </nav>
    </header>
  );
}

export default AdminNavbar;
