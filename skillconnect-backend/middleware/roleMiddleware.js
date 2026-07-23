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