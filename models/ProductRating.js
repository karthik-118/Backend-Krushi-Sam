// backend-node/models/ProductRating.js
import mongoose from "mongoose";

const productRatingSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  orderId:   { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  value:     { type: Number, min: 1, max: 5, required: true },
  comment:   { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// one rating per user per product
productRatingSchema.index({ productId: 1, userId: 1 }, { unique: true });

export default mongoose.model("ProductRating", productRatingSchema);
