const express = require("express");
const router = express.Router();

const { addReview, getMyReviews, getServiceReviews } = require("../controllers/reviewController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get("/service/:serviceId", getServiceReviews);
router.get("/my", verifyToken, authorizeRoles("customer"), getMyReviews);
router.post("/", verifyToken, authorizeRoles("customer"), addReview);

module.exports = router;
