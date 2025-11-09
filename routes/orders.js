import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Order from "../models/Order.js";

const router = express.Router();

/**
 * Create order
 * Accepts either:
 *  - { products, totalAmount, shippingDetails, customerName, customerEmail, paymentMethod, paymentInfo, status }
 *  - { items, total, address, ... }
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      // model-style
      items, total, address, customerName, customerEmail, paymentMethod, status,
      // legacy
      products, totalAmount, shippingDetails,
    } = req.body;

    const srcItems = (Array.isArray(items) && items.length ? items : products) || [];
    if (!srcItems.length) return res.status(400).json({ message: "Order items are required" });

    // normalize items (add sellerId if your product has it; else leave empty)
    const normItems = srcItems.map(it => ({
      productId: it.productId,
      sellerId: it.sellerId, // optional
      name: it.name || "",
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
    }));

    // total
    const normTotal = typeof total === "number"
      ? total
      : typeof totalAmount === "number"
      ? totalAmount
      : normItems.reduce((s, it) => s + it.price * it.quantity, 0);

    // address
    const normAddress = address && typeof address === "object"
      ? {
          line1: address.line1 || address.address || "",
          line2: address.line2 || "",
          city: address.city || "",
          state: address.state || "",
          postalCode: address.postalCode || address.pincode || "",
          country: address.country || "India",
        }
      : {
          line1: shippingDetails?.address || "",
          line2: "",
          city: shippingDetails?.city || "",
          state: shippingDetails?.state || "",
          postalCode: shippingDetails?.pincode || "",
          country: "India",
        };

    const order = new Order({
      userId: req.user.id,
      customerName: customerName || "",
      customerEmail: customerEmail || "",
      address: normAddress,
      items: normItems,
      total: normTotal,
      status: (status || "pending").toLowerCase(),
      paymentMethod: paymentMethod || "COD",
    });

    const saved = await order.save();
    return res.status(201).json({ message: "Order created", order: saved });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/** Get current user's orders */
router.get("/", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/** (Optional) Get seller's orders (orders containing seller's items) */
router.get("/seller", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can access this" });
    }
    const orders = await Order.find({
      items: { $elemMatch: { sellerId: req.user.id } }
    }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    console.error("GET /api/orders/seller error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/** Seller marks order delivered */
router.patch("/:id/deliver", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can mark delivered" });
    }

    // restrict: order must have at least one item of this seller (if you store sellerId per item)
    const order = await Order.findOne({
      _id: req.params.id,
      "items.sellerId": req.user.id
    });

    if (!order) return res.status(404).json({ message: "Order not found for this seller" });

    order.status = "delivered";
    order.deliveredAt = new Date();
    await order.save();

    return res.json({ message: "Order marked as delivered", order });
  } catch (err) {
    console.error("PATCH /api/orders/:id/deliver error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/** Buyer rates an order (only after delivered) */
router.patch("/:id/rate", verifyToken, async (req, res) => {
  try {
    const { value, comment } = req.body;
    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ message: "Rating value must be 1-5" });
    }

    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "delivered") {
      return res.status(400).json({ message: "You can rate only after delivery" });
    }

    order.buyerRating = { value, comment: comment || "", ratedAt: new Date() };
    await order.save();

    return res.json({ message: "Rating saved", order });
  } catch (err) {
    console.error("PATCH /api/orders/:id/rate error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
