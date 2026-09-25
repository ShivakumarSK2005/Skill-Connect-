/**
 * WHAT IT DOES:
 *   Entry point for the Skill Connect REST API server built with Express.js.
 * 
 * WHY WE ADDED IT:
 *   - Bootstraps the backend server, registers CORS and JSON parsing middlewares,
 *     connects database pools, and binds API route modules.
 * 
 * HOW IT WORKS:
 *   1. Initializes Express application instance.
 *   2. Registers `cors()` allowing frontend web apps to make cross-origin requests.
 *   3. Registers `express.json()` to parse incoming JSON request payloads.
 *   4. Mounts modular routes under `/api/*` endpoints.
 *   5. Starts listening on port 5000.
 */
const express = require("express");
const cors = require("cors");
require("./config/db");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { verifyToken } = require("./middleware/authMiddleware");
const { authorizeRoles } = require("./middleware/roleMiddleware");

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// API Route Modules
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// Health Check & Role Verification Test Endpoints
app.get("/protected", verifyToken, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

app.get("/provider-only", verifyToken, authorizeRoles("provider"), (_req, res) => {
  res.json({ message: "Welcome Provider" });
});

app.get("/customer-only", verifyToken, authorizeRoles("customer"), (_req, res) => {
  res.json({ message: "Welcome Customer" });
});

app.get("/", (_req, res) => {
  res.send("SkillConnect API running");
});

// 15-Minute Background Task: Expire stale unstarted bookings older than 1 hour
const expireStaleBookings = () => {
  const sql = `
    UPDATE bookings
    SET status = 'expired'
    WHERE status IN ('pending', 'confirmed', 'pending_start')
      AND booking_date < DATE_SUB(NOW(), INTERVAL 1 HOUR)
  `;
  const db = require("./config/db");
  db.query(sql, (err, result) => {
    if (err) {
      console.error("[Cleanup Job] Error expiring stale bookings:", err.message);
    } else if (result && result.affectedRows > 0) {
      console.log(`[Cleanup Job] Auto-expired ${result.affectedRows} stale bookings`);
    }
  });
};

// Run stale booking check on startup and every 15 minutes
expireStaleBookings();
setInterval(expireStaleBookings, 15 * 60 * 1000);

// Port Binding & Startup (Supports cloud PORT environment variable)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
