
const { z } = require("zod");
const Order = require("../models/Order");
const { checkout } = require("../services/checkoutService");

const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  addressLine: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(15),
  country: z.string().trim().min(2).max(100),
}).strict();

const createOrder = async (req, res, next) => {
  try {
    const parsed = z.object({
      shippingAddress: addressSchema,
    }).strict().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid checkout details",
        errors: parsed.error.issues,
      });
    }

    const result = await checkout({
      userId: req.user._id.toString(),
      shippingAddress: parsed.data.shippingAddress,
      idempotencyKey: req.get("Idempotency-Key"),
    });

    return res.status(result.replayed ? 200 : 201).json({
      success: true,
      replayed: result.replayed,
      message: result.replayed
        ? "Existing order returned"
        : "Order created successfully",
      order: result.order,
    });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    next(error);
  }
};

const { transitionOrderState } = require("../services/orderStateMachine");

const cancelOrder = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    // If not admin, user can only cancel their own order
    if (req.user.role !== "ADMIN") {
      filter.user = req.user._id;
    }

    const order = await Order.findOne(filter);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "CANCELLED") {
      return res.status(200).json({
        success: true,
        message: "Order is already cancelled",
        order,
      });
    }

    await transitionOrderState(order, "CANCELLED", {
      reason: req.body?.reason || "Cancelled by user",
    });

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully and inventory restored",
      order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Target status is required",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await transitionOrderState(order, status, { reason });

    res.status(200).json({
      success: true,
      message: `Order transitioned to ${status} successfully`,
      order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
};
