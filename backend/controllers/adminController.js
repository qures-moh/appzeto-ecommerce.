const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const getDashboard = async (req, res, next) => {
  try {
    const { range = "30d", startDate, endDate } = req.query;

    let dateFilter = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    } else if (range === "7d") {
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      };
    } else if (range === "30d") {
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      };
    } else if (range === "90d") {
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        },
      };
    }

    // 1. Total orders count
    const totalOrders = await Order.countDocuments(dateFilter);

    // Total registered customers
    const totalCustomers = await User.countDocuments({ role: "USER" });

    // Total active products in store
    const totalProducts = await Product.countDocuments({ isActive: true });

    // 2. Revenue calculation
    const revenueAgg = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
        },
      },
    ]);
    const revenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // 3. Pending orders
    const pendingOrders = await Order.countDocuments({
      ...dateFilter,
      status: { $in: ["PENDING", "PAYMENT_PROCESSING"] },
    });

    // 4. Failed payments
    const failedPayments = await Order.countDocuments({
      ...dateFilter,
      $or: [{ status: "PAYMENT_FAILED" }, { paymentStatus: "FAILED" }],
    });

    // 5. Low-stock products (stock <= 10 or any variant stock <= 10)
    const lowStockProducts = await Product.find({
      isActive: true,
      $or: [
        { stock: { $lte: 10 } },
        { "variants.stock": { $lte: 10 } },
      ],
    })
      .select("name sku price stock variants category")
      .limit(10)
      .lean();

    // 6. Top products by quantity sold
    const topProductsAgg = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          sku: { $first: "$items.sku" },
          totalUnitsSold: { $sum: "$items.quantity" },
          totalSales: { $sum: "$items.lineTotal" },
        },
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: 5 },
    ]);

    // 7. Basic sales analytics (grouped by date)
    const salesTimeline = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 8. Recent orders
    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 9. Status distribution
    const statusDistribution = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalCustomers,
        totalProducts,
        revenue: Math.round(revenue * 100) / 100,
        pendingOrders,
        failedPayments,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts,
      topProducts: topProductsAgg,
      salesTimeline,
      recentOrders,
      statusDistribution,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.search) {
      const term = req.query.search.trim();
      // Match ID or idempotencyKey
      filter.$or = [
        { idempotencyKey: { $regex: term, $options: "i" } },
        ...(mongoose.isValidObjectId(term) ? [{ _id: term }] : []),
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      orders,
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

module.exports = {
  getDashboard,
  getAdminOrders,
};
