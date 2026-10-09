const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");

const roundMoney = (amount) =>
  Math.round((amount + Number.EPSILON) * 100) / 100;

const calculateUnitPrice = (price, discountType, discountValue) => {
  const discount =
    discountType === "percentage"
      ? price * (discountValue / 100)
      : (discountValue || 0);

  return roundMoney(Math.max(0, price - discount));
};

const rollbackReservations = async (reservedDeductions) => {
  for (const item of reservedDeductions) {
    try {
      if (item.variantId) {
        await Product.updateOne(
          { _id: item.productId, "variants._id": item.variantId },
          { $inc: { "variants.$.stock": item.quantity } }
        );
      } else {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stock: item.quantity } }
        );
      }
    } catch (e) {
      console.error("Error during rollback of reservation:", e);
    }
  }
};

const checkout = async ({ userId, shippingAddress, idempotencyKey }) => {
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid user ID");
    error.status = 400;
    throw error;
  }

  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.length < 8 ||
    idempotencyKey.length > 128 ||
    !/^[a-zA-Z0-9_-]+$/.test(idempotencyKey)
  ) {
    const error = new Error("A valid Idempotency-Key header is required");
    error.status = 400;
    throw error;
  }

  // Fast-path idempotency check
  const existingOrder = await Order.findOne({
    user: userId,
    idempotencyKey,
  }).lean();

  if (existingOrder) {
    return { order: existingOrder, replayed: true };
  }

  const performCheckout = async (session = null) => {
    const duplicate = await Order.findOne({
      user: userId,
      idempotencyKey,
    }).session(session);

    if (duplicate) {
      return { order: duplicate.toObject(), replayed: true };
    }

    const cart = await Cart.findOne({ user: userId }).session(session);

    if (!cart || cart.items.length === 0) {
      const error = new Error("Your cart is empty");
      error.status = 400;
      throw error;
    }

    const orderItems = [];
    let subtotal = 0;
    let totalDiscount = 0;
    const reservedDeductions = [];

    try {
      for (const cartItem of cart.items) {
        const product = await Product.findOne({
          _id: cartItem.product,
          isActive: true,
        }).session(session);

        if (!product) {
          const error = new Error("A product in your cart is unavailable");
          error.status = 409;
          throw error;
        }

        let unitPrice;
        let sku;
        let stockFilter;
        let stockUpdate;

        if (cartItem.variantId) {
          const variant = product.variants.id(cartItem.variantId);

          if (!variant) {
            const error = new Error("A selected variant is unavailable");
            error.status = 409;
            throw error;
          }

          unitPrice = variant.price;
          sku = variant.sku;

          stockFilter = {
            _id: product._id,
            isActive: true,
            variants: {
              $elemMatch: {
                _id: variant._id,
                stock: { $gte: cartItem.quantity },
              },
            },
          };

          stockUpdate = {
            $inc: {
              "variants.$.stock": -cartItem.quantity,
            },
          };
        } else {
          unitPrice = product.price;
          sku = product.sku;

          stockFilter = {
            _id: product._id,
            isActive: true,
            stock: { $gte: cartItem.quantity },
          };

          stockUpdate = {
            $inc: { stock: -cartItem.quantity },
          };
        }

        const finalUnitPrice = calculateUnitPrice(
          unitPrice,
          product.discountType,
          product.discountValue
        );

        const originalTotal = roundMoney(unitPrice * cartItem.quantity);
        const lineTotal = roundMoney(finalUnitPrice * cartItem.quantity);
        const discount = roundMoney(originalTotal - lineTotal);

        const queryOptions = session ? { new: true, session } : { new: true };
        const updatedProduct = await Product.findOneAndUpdate(
          stockFilter,
          stockUpdate,
          queryOptions
        );

        if (!updatedProduct) {
          const error = new Error(`Insufficient stock for ${product.name}`);
          error.status = 409;
          throw error;
        }

        reservedDeductions.push({
          productId: product._id,
          variantId: cartItem.variantId || null,
          quantity: cartItem.quantity,
        });

        subtotal = roundMoney(subtotal + originalTotal);
        totalDiscount = roundMoney(totalDiscount + discount);

        orderItems.push({
          product: product._id,
          variantId: cartItem.variantId || null,
          name: product.name,
          sku,
          quantity: cartItem.quantity,
          unitPrice: finalUnitPrice,
          discount,
          lineTotal,
        });
      }

      // 5% tax calculated on discounted item total
      const tax = roundMoney(
        orderItems.reduce((sum, item) => sum + item.lineTotal, 0) * 0.05
      );

      // Shipping: Free if subtotal - discount >= 1000, else 50
      const shipping = subtotal - totalDiscount >= 1000 ? 0 : 50;
      const total = roundMoney(subtotal - totalDiscount + tax + shipping);

      const orderData = {
        user: userId,
        items: orderItems,
        shippingAddress,
        subtotal,
        discount: totalDiscount,
        tax,
        shipping,
        total,
        status: "PENDING",
        paymentStatus: "PENDING",
        idempotencyKey,
      };

      const [order] = await Order.create([orderData], session ? { session } : {});

      await Cart.updateOne(
        { user: userId },
        { $set: { items: [] } },
        session ? { session } : {}
      );

      return { order: order.toObject ? order.toObject() : order, replayed: false };
    } catch (err) {
      if (!session) {
        // Standalone compensation rollback
        await rollbackReservations(reservedDeductions);
      }
      throw err;
    }
  };

  // Try with replica-set transaction first; if not supported on standalone mongo, fallback cleanly
  let session = null;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await performCheckout(session);
    });
    return result;
  } catch (err) {
    if (
      err.message &&
      (err.message.includes("replica set") ||
        err.message.includes("Transaction numbers are only allowed"))
    ) {
      // Fallback for standalone MongoDB with atomic conditional updates & rollback compensation
      return await performCheckout(null);
    }
    throw err;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

module.exports = { checkout, roundMoney, calculateUnitPrice };
