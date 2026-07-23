import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getCurrentUser } from "../Services/auth";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const role = user?.role;

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const customerLinks = [
    { label: "Services", path: "/services" },
    { label: "My Bookings", path: "/bookings" },
    { label: "Profile", path: "/profile" }
  ];

  const providerLinks = [
    { label: "Dashboard", path: "/provider-dashboard" },
    { label: "Bookings", path: "/provider-bookings" },
    { label: "Services", path: "/provider-services" },
    { label: "Profile", path: "/profile" }
  ];
  const adminLinks = [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Bookings", path: "/admin-bookings" },
    { label: "Categories", path: "/admin-categories" },
    { label: "Accounts", path: "/admin-users" },
    { label: "Services", path: "/admin-services" },
    { label: "Profile", path: "/profile" }
  ];
  const links =
    role === "provider" ? providerLinks : role === "admin" ? adminLinks : customerLinks;

  return (
    <header className="app-navbar">
      <div className="nav-brand-wrap">
        <Link
          className="brand-mark"
          to={
            role === "provider"
              ? "/provider-dashboard"
              : role === "admin"
                ? "/admin-dashboard"
                : "/services"
          }
        >
          SC
        </Link>
        <div>
          <p className="nav-eyebrow">Skill Connect</p>
          <h1 className="nav-title">
            {role === "admin"
              ? "Admin control center"
              : "Find and manage trusted professionals"}
          </h1>
        </div>
      </div>

      <nav className="nav-links">
        {links.map((link) => (
          <Link
            key={link.path}
            className={location.pathname === link.path ? "nav-link active" : "nav-link"}
            to={link.path}
          >
            {link.label}
          </Link>
        ))}
        <button className="btn btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
