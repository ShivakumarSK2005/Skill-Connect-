/**
 * WHAT IT DOES:
 *   Higher-order middleware factory that enforces Role-Based Access Control (RBAC).
 *   Accepts a list of permitted roles (e.g., 'admin', 'provider', 'customer') and returns
 *   an Express middleware function that checks if the logged-in user possesses one of those roles.
 * 
 * WHY WE ADDED IT:
 *   - Access Governance: Ensures customers cannot perform provider actions (like completing jobs or listing services)
 *     and regular users cannot access administrative dashboards or user deletion endpoints.
 *   - Clean declarative syntax: Can be chained cleanly in route definitions:
 *     router.post('/services', verifyToken, authorizeRoles('provider'), serviceController.addService);
 * 
 * HOW IT WORKS:
 *   1. Verifies that `req.user` was established by `verifyToken`. If missing, returns 401 Unauthorized.
 *   2. Compares `req.user.role` against the provided `...allowedRoles` array.
 *   3. If permitted, calls `next()` to proceed.
 *   4. If not permitted, stops execution and responds with 403 Forbidden ("Access denied").
 * 
 * @param {...string} allowedRoles - List of allowed roles, e.g. "admin", "provider"
 * @returns {Function} Express middleware function (req, res, next)
 */
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    // 🔹 Check if user exists
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔹 Check role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};