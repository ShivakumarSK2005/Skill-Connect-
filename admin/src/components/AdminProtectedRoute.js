import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth";

function AdminProtectedRoute({ children }) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
