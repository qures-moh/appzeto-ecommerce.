
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { z } = require("zod");

const itemSchema = z.object({
  productId: z.string().refine(
    (id) => mongoose.isValidObjectId(id),
    "Invalid product ID"
  ),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
});

const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product")
      .lean();

    res.status(200).json({
      success: true,
      cart: cart || { items: [] },
    });
  } catch (error) {
    next(error);
  }
};

const addCartItem = async (req, res, next) => {
  try {
    const parsed = itemSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item",
        errors: parsed.error.issues,
      });
    }

    const { productId, variantId, quantity } = parsed.data;

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let availableStock = product.stock;
    if (variantId) {
      const variant = product.variants.id(variantId);

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Product variant not found",
        });
      }
      availableStock = variant.stock;
    }

    if (availableStock <= 0) {
      return res.status(400).json({
        success: false,
        message: "This item is currently out of stock",
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        String(item.variantId || "") === String(variantId || "")
    );

    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (newQuantity > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Cannot add more than available stock (${availableStock} units available)`,
      });
    }

    if (newQuantity > 99) {
      return res.status(400).json({
        success: false,
        message: "Maximum quantity per cart item is 99",
      });
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId,
        variantId: variantId || null,
        quantity,
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const parsed = z.object({
      quantity: z.number().int().min(1).max(99),
    }).safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer between 1 and 99",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.id(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let availableStock = product.stock;
    if (item.variantId) {
      const variant = product.variants.id(item.variantId);
      if (variant) {
        availableStock = variant.stock;
      }
    }

    if (parsed.data.quantity > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Cannot exceed available stock of ${availableStock} units`,
      });
    }

    item.quantity = parsed.data.quantity;

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.id(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    item.deleteOne();

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
};
