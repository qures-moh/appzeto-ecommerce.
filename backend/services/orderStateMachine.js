const Product = require("../models/Product");

const ORDER_STATES = {
  PENDING: "PENDING",
  PAYMENT_PROCESSING: "PAYMENT_PROCESSING",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

// Allowed transitions according to the specification
const VALID_TRANSITIONS = {
  PENDING: ["PAYMENT_PROCESSING", "CANCELLED"],
  PAYMENT_PROCESSING: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "REFUNDED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  PAYMENT_FAILED: ["PAYMENT_PROCESSING", "CANCELLED"],
  CANCELLED: [],
  REFUNDED: [],
};

const isValidTransition = (fromState, toState) => {
  if (!fromState || !toState) return false;
  if (fromState === toState) return true; // idempotent no-op
  const allowed = VALID_TRANSITIONS[fromState];
  return Array.isArray(allowed) && allowed.includes(toState);
};

const restoreOrderInventory = async (order, session = null) => {
  if (!order || !order.items || order.items.length === 0) return;

  for (const item of order.items) {
    if (item.variantId) {
      await Product.updateOne(
        {
          _id: item.product,
          "variants._id": item.variantId,
        },
        {
          $inc: { "variants.$.stock": item.quantity },
        },
        session ? { session } : {}
      );
    } else {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } },
        session ? { session } : {}
      );
    }
  }
};

const transitionOrderState = async (order, nextState, { reason, note } = {}) => {
  const currentState = order.status;

  if (currentState === nextState) {
    return order; // idempotent
  }

  if (!isValidTransition(currentState, nextState)) {
    const error = new Error(
      `Invalid order state transition from ${currentState} to ${nextState}`
    );
    error.status = 400;
    throw error;
  }

  // If transitioning to CANCELLED or REFUNDED, restore inventory
  if (
    (nextState === ORDER_STATES.CANCELLED || nextState === ORDER_STATES.REFUNDED) &&
    currentState !== ORDER_STATES.CANCELLED &&
    currentState !== ORDER_STATES.REFUNDED
  ) {
    await restoreOrderInventory(order);
  }

  order.status = nextState;

  if (nextState === ORDER_STATES.PAID && !order.paidAt) {
    order.paidAt = new Date();
    order.paymentStatus = "SUCCESS";
  } else if (nextState === ORDER_STATES.PAYMENT_FAILED) {
    order.paymentStatus = "FAILED";
  } else if (nextState === ORDER_STATES.REFUNDED) {
    order.paymentStatus = "REFUNDED";
  }

  await order.save();
  return order;
};

module.exports = {
  ORDER_STATES,
  VALID_TRANSITIONS,
  isValidTransition,
  transitionOrderState,
  restoreOrderInventory,
};
