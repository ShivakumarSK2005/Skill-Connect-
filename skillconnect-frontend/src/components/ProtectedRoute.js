import { Navigate } from "react-router-dom";
import { getCurrentUser, getHomeRoute } from "../Services/auth";

/**
 * WHAT IT DOES:
 *   Higher-order wrapper component for React Router routes that guards pages against
 *   unauthenticated access or incorrect role privileges.
 * 
 * WHY WE ADDED IT:
 *   - Client-side Security: Prevents logged-out users from viewing private dashboards.
 *   - Role Isolation: Redirects a customer trying to access `/provider-dashboard` back to `/services`,
 *     or a provider trying to access admin screens back to their own dashboard.
 * 
 * HOW IT WORKS:
 *   1. Calls `getCurrentUser()`.
 *   2. If no token/user exists, redirects to login page (`/`).
 *   3. If `allowedRole` is specified and doesn't match `user.role`, redirects to the user's home route.
 *   4. If authorized, renders the protected `children` components.
 * 
 * @param {Object} props
 * @param {string} [props.allowedRole] - 'customer' | 'provider' | 'admin'
 * @param {React.ReactNode} props.children - Child component to render if authorized
 */
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
