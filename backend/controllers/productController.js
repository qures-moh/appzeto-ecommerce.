
const Product = require("../models/Product");
const { z } = require("zod");

const productSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    description: z.string().max(3000).optional(),
    images: z.array(z.string().url()).max(10).optional(),
    category: z.string().trim().min(1).max(100),
    price: z.number().finite().min(0),
    discountType: z.enum(["flat", "percentage"]).optional(),
    discountValue: z.number().finite().min(0).optional(),
    stock: z.number().int().min(0),
    sku: z.string().trim().min(1).max(100),
    variants: z
      .array(
        z
          .object({
            sku: z.string().trim().min(1).max(100),
            size: z.string().max(50).optional(),
            color: z.string().max(50).optional(),
            price: z.number().finite().min(0),
            stock: z.number().int().min(0),
          })
          .strict()
      )
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.discountType !== "percentage" ||
      (data.discountValue ?? 0) <= 100,
    {
      message: "Percentage discount cannot exceed 100",
      path: ["discountValue"],
    }
  );

const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const filter = { isActive: true };

    if (req.query.category) {
      filter.category = String(req.query.category).trim();
    }

    if (req.query.search) {
      const search = String(req.query.search).trim().slice(0, 100);

      if (search) {
        filter.$text = { $search: search };
      }
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid product data",
        errors: parsed.error.issues,
      });
    }

    const product = await Product.create(parsed.data);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Product SKU already exists",
      });
    }

    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const parsed = productSchema.partial().safeParse(req.body);

    if (
      !parsed.success ||
      Object.keys(req.body).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product update data",
        errors: parsed.success ? [] : parsed.error.issues,
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Product SKU already exists",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deactivated successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
