const jwt = require("jsonwebtoken");

/**
 * WHAT IT DOES:
 *   Express middleware that intercepts protected HTTP requests, validates the JSON Web Token (JWT)
 *   provided in the `Authorization` header, and attaches the authenticated user's payload to `req.user`.
 * 
 * WHY WE ADDED IT:
 *   - Security: Prevents unauthenticated users from accessing private routes (bookings, services, profiles).
 *   - Identity guarantee: Safely derives user identity (id, role, email) from the tamper-proof JWT signature,
 *     ensuring callers cannot spoof other users by simply passing a user_id in the request body.
 * 
 * HOW IT WORKS:
 *   1. Extracts the `Authorization` header from incoming HTTP request.
 *   2. Validates standard "Bearer <token>" format.
 *   3. Verifies the cryptographic signature using `process.env.JWT_SECRET`.
 *   4. If valid, attaches decoded user object (`{ id, role, email, iat, exp }`) to `req.user`.
 *   5. Calls `next()` to hand off control to the route controller.
 *   6. If missing, expired, or tampered with, immediately rejects request with 401 Unauthorized.
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware callback
 */
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // 🔹 Check token exists
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // 🔹 Extract token
 const parts = authHeader.split(" ");

if (parts.length !== 2 || parts[0] !== "Bearer") {
  return res.status(401).json({ message: "Invalid token format" });
}

const token = parts[1];

  // 🔹 Verify token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // 🔹 Attach user data
    req.user = decoded;

    next(); // move to next step
  });
};
