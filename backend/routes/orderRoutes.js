const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.post("/:id/cancel", cancelOrder);
router.patch("/:id/status", adminOnly, updateOrderStatus);

module.exports = router;
