const express = require("express");
const {
  getDashboard,
  getAdminOrders,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboard);
router.get("/orders", getAdminOrders);

module.exports = router;
