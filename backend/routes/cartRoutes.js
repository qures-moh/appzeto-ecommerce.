
const express = require("express");

const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:id", updateCartItem);
router.delete("/items/:id", removeCartItem);

module.exports = router;
