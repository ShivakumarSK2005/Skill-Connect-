const jwt = require("jsonwebtoken");

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
