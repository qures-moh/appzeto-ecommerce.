const mongoose = require("mongoose");
const Order = require("../models/Order");
const PaymentLog = require("../models/PaymentLog");
const WebhookLog = require("../models/WebhookLog");
const { transitionOrderState } = require("../services/orderStateMachine");
const backgroundQueue = require("../services/backgroundJobs");
const { z } = require("zod");

const paymentSchema = z.object({
  orderId: z.string().refine((id) => mongoose.isValidObjectId(id), "Invalid order ID"),
  paymentMethod: z.string().trim().default("card"),
  simulateOutcome: z.enum(["SUCCESS", "FAILED", "TIMEOUT"]).default("SUCCESS"),
});

const webhookSchema = z.object({
  eventId: z.string().trim().min(3),
  eventType: z.enum(["payment.succeeded", "payment.failed"]),
  orderId: z.string().refine((id) => mongoose.isValidObjectId(id), "Invalid order ID"),
  amount: z.number().optional(),
  transactionId: z.string().optional(),
});

const processPayment = async (req, res, next) => {
  try {
    const idempotencyKey = req.get("Idempotency-Key");

    if (!idempotencyKey || idempotencyKey.length < 8) {
      return res.status(400).json({
        success: false,
        message: "A valid Idempotency-Key header (min 8 chars) is required",
      });
    }

    const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment details",
        errors: parsed.error.issues,
      });
    }

    const { orderId, simulateOutcome } = parsed.data;

    // Check for replayed payment using idempotency key
    const existingLog = await PaymentLog.findOne({ idempotencyKey }).lean();
    if (existingLog) {
      const order = await Order.findById(existingLog.order).lean();
      return res.status(200).json({
        success: existingLog.outcome === "SUCCESS",
        replayed: true,
        message: "Payment replayed from previous idempotent submission",
        payment: existingLog,
        order,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify ownership
    if (req.user.role !== "ADMIN" && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to pay for this order",
      });
    }

    // If order already paid
    if (order.status === "PAID" || order.paymentStatus === "SUCCESS") {
      return res.status(400).json({
        success: false,
        message: "Order has already been paid",
        order,
      });
    }

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (simulateOutcome === "SUCCESS") {
      // Step to PAYMENT_PROCESSING first if PENDING
      if (order.status === "PENDING") {
        await transitionOrderState(order, "PAYMENT_PROCESSING");
      }
      await transitionOrderState(order, "PAID");
      order.paymentStatus = "SUCCESS";
      order.paidAt = new Date();
      await order.save();

      // Trigger background confirmation email
      backgroundQueue.enqueueOrderConfirmation(order);

      const log = await PaymentLog.create({
        order: order._id,
        user: req.user._id,
        idempotencyKey,
        amount: order.total,
        outcome: "SUCCESS",
        transactionId,
        responsePayload: { status: "COMPLETED", transactionId },
      });

      return res.status(200).json({
        success: true,
        message: "Payment successful",
        transactionId,
        paymentStatus: "SUCCESS",
        order,
      });
    }

    if (simulateOutcome === "FAILED") {
      if (order.status === "PENDING") {
        await transitionOrderState(order, "PAYMENT_PROCESSING");
      }
      await transitionOrderState(order, "PAYMENT_FAILED");
      order.paymentStatus = "FAILED";
      await order.save();

      await PaymentLog.create({
        order: order._id,
        user: req.user._id,
        idempotencyKey,
        amount: order.total,
        outcome: "FAILED",
        transactionId,
        responsePayload: { status: "FAILED", reason: "Simulated card decline" },
      });

      return res.status(402).json({
        success: false,
        message: "Payment declined by provider (Simulated)",
        transactionId,
        paymentStatus: "FAILED",
        order,
      });
    }

    if (simulateOutcome === "TIMEOUT") {
      if (order.status === "PENDING") {
        await transitionOrderState(order, "PAYMENT_PROCESSING");
      }
      order.paymentStatus = "TIMEOUT";
      await order.save();

      await PaymentLog.create({
        order: order._id,
        user: req.user._id,
        idempotencyKey,
        amount: order.total,
        outcome: "TIMEOUT",
        transactionId,
        responsePayload: { status: "TIMEOUT", reason: "Gateway did not respond in time" },
      });

      return res.status(408).json({
        success: false,
        message: "Payment request timed out (Simulated). Awaiting webhook confirmation.",
        transactionId,
        paymentStatus: "TIMEOUT",
        order,
      });
    }
  } catch (error) {
    next(error);
  }
};

const handlePaymentWebhook = async (req, res, next) => {
  try {
    const parsed = webhookSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook payload",
        errors: parsed.error.issues,
      });
    }

    const { eventId, eventType, orderId } = parsed.data;

    // Idempotent webhook check: if eventId already processed, return 200 without reprocessing
    const existingLog = await WebhookLog.findOne({ eventId });
    if (existingLog) {
      return res.status(200).json({
        success: true,
        replayed: true,
        message: "Webhook event already processed (Idempotent replay)",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order referenced by webhook does not exist",
      });
    }

    if (eventType === "payment.succeeded") {
      if (order.status === "PENDING" || order.status === "PAYMENT_PROCESSING") {
        if (order.status === "PENDING") {
          await transitionOrderState(order, "PAYMENT_PROCESSING");
        }
        await transitionOrderState(order, "PAID");
        order.paymentStatus = "SUCCESS";
        order.paidAt = new Date();
        await order.save();

        backgroundQueue.enqueueOrderConfirmation(order);
      } else {
        // Order is already PAID, PROCESSING, SHIPPED, or DELIVERED
        if (order.paymentStatus !== "SUCCESS") {
          order.paymentStatus = "SUCCESS";
          await order.save();
        }
      }
    } else if (eventType === "payment.failed") {
      if (order.status === "PENDING" || order.status === "PAYMENT_PROCESSING") {
        await transitionOrderState(order, "PAYMENT_FAILED");
        order.paymentStatus = "FAILED";
        await order.save();
      }
    }

    try {
      await WebhookLog.create({
        eventId,
        eventType,
        orderId: order._id,
        payload: req.body,
        status: "PROCESSED",
      });
    } catch (logErr) {
      if (logErr.code === 11000) {
        return res.status(200).json({
          success: true,
          replayed: true,
          message: "Webhook event already processed (Idempotent replay)",
        });
      }
      throw logErr;
    }

    return res.status(200).json({
      success: true,
      message: "Webhook event processed successfully",
      orderStatus: order.status,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processPayment,
  handlePaymentWebhook,
};
