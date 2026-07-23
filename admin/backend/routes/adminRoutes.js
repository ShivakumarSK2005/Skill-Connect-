const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getCategories,
  createCategory,
  deleteCategory,
  getManagedUsers,
  deleteManagedUser
} = require("../controllers/adminController");

router.use(verifyToken, authorizeRoles("admin"));

router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.delete("/categories/:id", deleteCategory);
router.get("/users", getManagedUsers);
router.delete("/users/:id", deleteManagedUser);

module.exports = router;
