const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  createBooking,
  updateBookingStatus,
  getCustomerBookings,
  getProviderBookings,
  markAsCompleted,
  requestStart,
  confirmStart,
  cancelBooking
} = require("../controllers/bookingController");

// 🔹 Customer books service
router.post("/", verifyToken, authorizeRoles("customer"), createBooking);

// 🔹 Provider → Accept / Reject Booking
router.put("/:id/status", verifyToken, authorizeRoles("provider"), updateBookingStatus);

// 👤 Customer bookings
router.get("/my", verifyToken, authorizeRoles("customer"), getCustomerBookings);

// 🧑‍🔧 Provider bookings
router.get("/provider", verifyToken, authorizeRoles("provider"), getProviderBookings);

// 🔹 Provider to mark Services As Complete
router.put("/:id/complete", verifyToken, authorizeRoles("provider"), markAsCompleted);

// 🔹 Provider to mark Services As Request-start
router.put("/:id/request-start", verifyToken, authorizeRoles("provider"), requestStart);

// 🔹 Customer To Confirm Provider Started-Working
router.put("/:id/confirm-start", verifyToken, authorizeRoles("customer"), confirmStart);

// 🔹 Customer → Cancel Booking
router.put("/:id/cancel", verifyToken, authorizeRoles("customer"), cancelBooking);

module.exports = router;
