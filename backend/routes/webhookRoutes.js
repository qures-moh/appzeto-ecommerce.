const express = require("express");
const { handlePaymentWebhook } = require("../controllers/paymentController");

const router = express.Router();

router.post("/payment", handlePaymentWebhook);

module.exports = router;
