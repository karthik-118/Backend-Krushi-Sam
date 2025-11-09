// backend-node/routes/products.js
import express from "express";
import Product from "../models/Product.js";
import { verifyToken } from "../middleware/auth.js";

// ⭐ ratings support
import ProductRating from "../models/ProductRating.js";
import Order from "../models/Order.js";

const router = express.Router();

/* ======================
   PRODUCTS (CRUD-lite)
   ====================== */

// Add product (seller only)
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can add products" });
    }

    const { name, description, price, category, imageUrl } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      imageUrl,
      sellerId: req.user.id,
      status: "published",
    });

    await product.save();
    return res.status(201).json(product);
  } catch (err) {
    console.error("POST /api/products error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all published products
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find({ status: "published" })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(products);
  } catch (err) {
    console.error("GET /api/products error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get seller-specific products
router.get("/seller/products", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can view this" });
    }
    const products = await Product.find({ sellerId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(products);
  } catch (err) {
    console.error("GET /api/products/seller/products error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ======================
   RATINGS
   ====================== */

/**
 * GET /api/products/:productId/rating
 * -> { average, count }
 */
router.get("/:productId/rating", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    return res.json({
      average: product.averageRating || 0,
      count: product.ratingCount || 0,
    });
  } catch (err) {
    console.error("GET /api/products/:id/rating error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * (optional) GET /api/products/:productId/ratings
 * -> recent ratings list
 */
router.get("/:productId/ratings", async (req, res) => {
  try {
    const ratings = await ProductRating.find({ productId: req.params.productId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    return res.json(ratings);
  } catch (err) {
    console.error("GET /api/products/:id/ratings error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * POST /api/products/:productId/rate
 * Body: { value: 1..5, comment?: string, orderId?: string }
 * Rules:
 *  - must be authenticated
 *  - must have a DELIVERED order that includes this product
 *  - upsert rating; recompute Product.averageRating & ratingCount
 */
router.post("/:productId/rate", verifyToken, async (req, res) => {
  try {
    const { value, comment = "", orderId } = req.body;
    const productId = req.params.productId;
    const userId = req.user.id;

    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ message: "Rating value must be 1-5" });
    }

    const prod = await Product.findById(productId);
    if (!prod) return res.status(404).json({ message: "Product not found" });

    // verify delivered order for this user & product
    const deliveredOrder = await Order.findOne({
      userId,
      status: "delivered",
      "items.productId": productId,
      ...(orderId ? { _id: orderId } : {}),
    }).select("_id");

    if (!deliveredOrder) {
      return res
        .status(400)
        .json({ message: "You can rate only after delivery of this product." });
    }

    // upsert rating
    const now = new Date();
    await ProductRating.updateOne(
      { productId, userId },
      {
        $set: {
          productId,
          userId,
          orderId: deliveredOrder._id,
          value: Number(value),
          comment: comment || "",
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    // recompute aggregates
    const agg = await ProductRating.aggregate([
      { $match: { productId: prod._id } },
      { $group: { _id: "$productId", average: { $avg: "$value" }, count: { $sum: 1 } } },
    ]);

    const average = agg[0]?.average || 0;
    const count = agg[0]?.count || 0;

    prod.averageRating = Number(average.toFixed(2));
    prod.ratingCount = count;
    await prod.save();

    return res.json({
      message: "Rating saved",
      rating: { average: prod.averageRating, count: prod.ratingCount },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ message: "You already rated this product. Try updating it instead." });
    }
    console.error("POST /api/products/:id/rate error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ======================
   DELETE (seller only)
   ====================== */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await product.deleteOne();
    return res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/products/:id error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
