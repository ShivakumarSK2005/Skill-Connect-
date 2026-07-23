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

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

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

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
