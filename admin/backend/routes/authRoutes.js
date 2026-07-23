const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { login, getProfile, getAdmins, createAdmin } = require("../controllers/authController");

router.post("/login", login);
router.post("/admins", createAdmin);
router.get("/profile", verifyToken, authorizeRoles("admin"), getProfile);
router.get("/admins", verifyToken, authorizeRoles("admin"), getAdmins);

module.exports = router;
