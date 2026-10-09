
const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  deleteAddress,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.delete("/addresses/:id", protect, deleteAddress);

module.exports = router;