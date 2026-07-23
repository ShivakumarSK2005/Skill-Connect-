const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  signup,
  login,
  getProfile,
  updateProfile,
  createAdmin,
  getAdmins
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.get("/admins", verifyToken, authorizeRoles("admin"), getAdmins);
router.post("/admins", verifyToken, authorizeRoles("admin"), createAdmin);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

module.exports = router;
