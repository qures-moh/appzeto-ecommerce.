require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const seedData = async () => {
  const uri =
    process.env.MONGODB_URL ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/appzeto_ecommerce";

  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(uri);

  console.log("Clearing existing collections...");
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});

  console.log("Creating users...");
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const userPassword = await bcrypt.hash("User@1234", 12);

  const admin = await User.create({
    name: "Appzeto Admin",
    email: "admin@appzeto.com",
    password: adminPassword,
    role: "ADMIN",
    phone: "+91 9876543210",
  });

  const customer = await User.create({
    name: "John Doe",
    email: "user@appzeto.com",
    password: userPassword,
    role: "USER",
    phone: "+91 9123456780",
    addresses: [
      {
        name: "John Doe",
        phone: "+91 9123456780",
        addressLine: "Flat 402, Highrise Heights, MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
        isDefault: true,
      },
    ],
  });

  console.log("Creating products with variants...");
  const products = [
    {
      name: "Appzeto Signature T-Shirt",
      description:
        "Premium combed organic cotton t-shirt designed for maximum comfort and all-day breathability. Features tailored fit and durable stitching.",
      images: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
      ],
      category: "Apparel",
      price: 799,
      discountType: "percentage",
      discountValue: 15,
      stock: 45,
      sku: "TSH-SIG-001",
      variants: [
        { sku: "TSH-BLK-S", size: "Small", color: "Black", price: 799, stock: 10 },
        { sku: "TSH-BLK-M", size: "Medium", color: "Black", price: 799, stock: 12 },
        { sku: "TSH-BLK-L", size: "Large", color: "Black", price: 799, stock: 8 },
        { sku: "TSH-WHT-S", size: "Small", color: "White", price: 799, stock: 8 },
        { sku: "TSH-WHT-M", size: "Medium", color: "White", price: 799, stock: 7 },
      ],
    },
    {
      name: "Urban Strider Running Sneakers",
      description:
        "High-performance athletic running footwear with dual-density foam responsive cushioning and breathable knit mesh upper.",
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80",
      ],
      category: "Footwear",
      price: 3499,
      discountType: "flat",
      discountValue: 500,
      stock: 30,
      sku: "SNK-URB-002",
      variants: [
        { sku: "SNK-RED-8", size: "UK 8", color: "Crimson Red", price: 3499, stock: 10 },
        { sku: "SNK-RED-9", size: "UK 9", color: "Crimson Red", price: 3499, stock: 12 },
        { sku: "SNK-RED-10", size: "UK 10", color: "Crimson Red", price: 3499, stock: 8 },
      ],
    },
    {
      name: "WeatherShield All-Season Parka",
      description:
        "Stormproof insulated thermal outdoor jacket featuring sealed seams, fleece-lined collar, and ergonomic water-resistant pockets.",
      images: [
        "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&auto=format&fit=crop&q=80",
      ],
      category: "Outerwear",
      price: 4999,
      discountType: "percentage",
      discountValue: 20,
      stock: 18,
      sku: "JKT-PARK-003",
      variants: [
        { sku: "JKT-OLV-M", size: "Medium", color: "Olive Green", price: 4999, stock: 9 },
        { sku: "JKT-OLV-L", size: "Large", color: "Olive Green", price: 4999, stock: 9 },
      ],
    },
    {
      name: "Aura ANC Wireless Studio Headphones",
      description:
        "Industry-leading active noise cancellation with 40mm titanium diaphragm drivers, 40-hour battery life, and crystal-clear voice mics.",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      ],
      category: "Electronics",
      price: 8999,
      discountType: "flat",
      discountValue: 1000,
      stock: 15,
      sku: "AUD-ANC-004",
      variants: [
        { sku: "AUD-MAT-BLK", size: "Standard", color: "Matte Black", price: 8999, stock: 8 },
        { sku: "AUD-SLV-WHT", size: "Standard", color: "Silver White", price: 8999, stock: 7 },
      ],
    },
    {
      name: "Chronos Heritage Automatic Watch",
      description:
        "Precision Swiss movement mechanical timepiece with sapphire crystal glass, 50m water resistance, and genuine Italian leather strap.",
      images: [
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80",
      ],
      category: "Accessories",
      price: 12499,
      discountType: "flat",
      discountValue: 1500,
      stock: 5, // Low stock on purpose to test concurrency & low-stock alerts
      sku: "WCH-CHR-005",
      variants: [],
    },
  ];

  const createdProducts = await Product.create(products);

  console.log("Creating seed order for analytics...");
  await Order.create({
    user: customer._id,
    items: [
      {
        product: createdProducts[0]._id,
        variantId: createdProducts[0].variants[0]._id,
        name: createdProducts[0].name,
        sku: createdProducts[0].variants[0].sku,
        quantity: 1,
        unitPrice: 679.15,
        discount: 119.85,
        lineTotal: 679.15,
      },
    ],
    shippingAddress: customer.addresses[0],
    subtotal: 799,
    discount: 119.85,
    tax: 33.96,
    shipping: 50,
    total: 763.11,
    status: "PAID",
    paymentStatus: "SUCCESS",
    idempotencyKey: "seed_order_idem_key_01",
    paidAt: new Date(),
  });

  console.log("Seeding completed successfully!");
  console.log("Credentials:");
  console.log("Admin: admin@appzeto.com / Admin@1234");
  console.log("User:  user@appzeto.com  / User@1234");
  process.exit(0);
};

seedData().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
