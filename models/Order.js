import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional but useful
  name: String,
  price: Number,
  quantity: { type: Number, default: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: String,
  customerEmail: String,

  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: "India" }
  },

  items: [orderItemSchema],

  total: { type: Number, required: true },

  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending"
  },

  deliveredAt: Date,

  paymentMethod: String,

  // Buyer rating (set once delivered)
  buyerRating: {
    value: { type: Number, min: 1, max: 5 },
    comment: String,
    ratedAt: Date
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", orderSchema);
