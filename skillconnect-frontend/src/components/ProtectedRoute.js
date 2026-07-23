import { Navigate } from "react-router-dom";
import { getCurrentUser, getHomeRoute } from "../Services/auth";

function ProtectedRoute({ allowedRole, children }) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
