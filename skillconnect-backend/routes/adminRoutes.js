const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getDashboardSummary,
  getCategories,
  createCategory,
  deleteCategory,
  getManagedUsers,
  deleteManagedUser,
  getManagedServices,
  deactivateService,
  getAdminBookings
} = require("../controllers/adminController");

router.use(verifyToken, authorizeRoles("admin"));

router.get("/summary", getDashboardSummary);
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.delete("/categories/:id", deleteCategory);
router.get("/users", getManagedUsers);
router.delete("/users/:id", deleteManagedUser);
router.get("/services", getManagedServices);
router.delete("/services/:id", deactivateService);
router.get("/bookings", getAdminBookings);

module.exports = router;
