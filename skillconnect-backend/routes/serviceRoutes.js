/**
 * WHAT IT DOES:
 *   Defines API routes for services and categories.
 * 
 * WHY WE ADDED IT:
 *   - Allows customers to browse services publicly (`GET /`).
 *   - Restricts service creation, modification, deletion, and provider queries (`/my`) to authenticated providers.
 */
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  addService,
  updateService,
  getCategories,
  getServiceTypes,
  getAllServices,
  getProviderServices,
  deleteService
} = require("../controllers/serviceController");

router.get("/types", getServiceTypes);
router.get("/categories", verifyToken, authorizeRoles("provider"), getCategories);
router.get("/", getAllServices);
router.get("/my", verifyToken, authorizeRoles("provider"), getProviderServices);
router.post("/", verifyToken, authorizeRoles("provider"), addService);
router.put("/:id", verifyToken, authorizeRoles("provider"), updateService);
router.delete("/:id", verifyToken, authorizeRoles("provider"), deleteService);

module.exports = router;
