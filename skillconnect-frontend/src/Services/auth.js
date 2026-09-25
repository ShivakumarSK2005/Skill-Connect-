/**
 * WHAT IT DOES:
 *   Retrieves the stored JWT string from the browser's localStorage.
 * 
 * WHY WE ADDED IT:
 *   - Used across API interceptors and auth guards to check if a session exists.
 * 
 * @returns {string|null} JWT token string or null if not logged in
 */
export function getToken() {
  return localStorage.getItem("token");
}

/**
 * WHAT IT DOES:
 *   Removes the authentication token from localStorage, effectively terminating the user session.
 * 
 * WHY WE ADDED IT:
 *   - Triggered on manual user logout or when an API request returns 401 Unauthorized.
 */
export function clearSession() {
  localStorage.removeItem("token");
}

/**
 * WHAT IT DOES:
 *   Decodes the Base64URL-encoded payload section of a JWT token on the client side without needing external libraries.
 * 
 * WHY WE ADDED IT:
 *   - Lightweight JWT inspection: Allows the client to quickly inspect the user's role and expiration
 *     without making an extra network request to the backend.
 * 
 * HOW IT WORKS:
 *   1. Splits the JWT by '.' and takes the 2nd part (the payload).
 *   2. Decodes Base64 using `atob()`.
 *   3. Parses the decoded JSON string.
 * 
 * @param {string} token - JWT string
 * @returns {Object|null} Decoded payload object or null if invalid
 */
export function decodeToken(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/**
 * WHAT IT DOES:
 *   Derives the currently authenticated user's session details (`token`, `id`, `role`, `exp`).
 * 
 * WHY WE ADDED IT:
 *   - Powers route guards (`ProtectedRoute.js`) and UI conditionals (showing provider vs customer navigation).
 * 
 * @returns {Object|null} User info object or null if not authenticated
 */
export function getCurrentUser() {
  const token = getToken();
  const decoded = decodeToken(token);

  if (!token || !decoded?.role) {
    return null;
  }

  return {
    token,
    id: decoded.id,
    role: decoded.role,
    exp: decoded.exp
  };
}

/**
 * WHAT IT DOES:
 *   Returns the default landing page URL based on a user's role:
 *   - provider -> `/provider-dashboard`
 *   - admin -> `/admin-dashboard`
 *   - customer -> `/services`
 * 
 * WHY WE ADDED IT:
 *   - Seamless redirection: Ensures each persona lands on their primary workspace immediately after login.
 * 
 * @param {string} role - 'provider' | 'admin' | 'customer'
 * @returns {string} Route path
 */
export function getHomeRoute(role) {
  if (role === "provider") {
    return "/provider-dashboard";
  }

  if (role === "admin") {
    return "/admin-dashboard";
  }

  return "/services";
}
