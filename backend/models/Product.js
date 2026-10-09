
const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    trim: true,
  },
  size: {
    type: String,
    trim: true,
    default: "",
  },
  color: {
    type: String,
    trim: true,
    default: "",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "Stock must be an integer",
    },
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      default: "",
      maxlength: 3000,
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ["flat", "percentage"],
      default: "flat",
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (value) {
          return (
            this.discountType !== "percentage" ||
            value <= 100
          );
        },
        message: "Percentage discount cannot exceed 100",
      },
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be an integer",
      },
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
