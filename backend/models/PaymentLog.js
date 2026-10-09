const mongoose = require("mongoose");

const paymentLogSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    outcome: {
      type: String,
      enum: ["SUCCESS", "FAILED", "TIMEOUT"],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentLog", paymentLogSchema);
