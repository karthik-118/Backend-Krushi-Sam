// import mongoose from "mongoose";

// const productSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: String,
//   price: { type: Number, required: true },
//   category: String,
//   imageUrl: String, // URL to uploaded image (e.g., /uploads/...)
//   sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   createdAt: { type: Date, default: Date.now },
//   status: { type: String, enum: ["pending","approved","published"], default: "published" }
// });

// export default mongoose.model("Product", productSchema);

import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  imageUrl: String,
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // ⭐ rating aggregates
  averageRating: { type: Number, default: 0 },  // 0 if no ratings
  ratingCount:   { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "approved", "published"], default: "published" }
});

export default mongoose.model("Product", productSchema);
